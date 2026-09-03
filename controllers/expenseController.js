const Expense = require('../models/Expense');
const Trip    = require('../models/Trip');

// POST /api/expense/add
const addExpense = async (req, res) => {
  try {
    const { tripId, description, amount, paidBy, category, splitType, splitBetween } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    let splits = splitBetween || [];

    // Auto equal-split among trip members if not supplied
    if (splitType === 'equal' && trip.members.length > 0) {
      const perPerson = parseFloat((amount / trip.members.length).toFixed(2));
      splits = trip.members.map(member => ({ member, amount: perPerson }));
    }

    // Auto percentage-split
    if (splitType === 'percentage' && splits.length > 0) {
      splits = splits.map(s => ({
        ...s,
        amount: parseFloat(((s.percentage / 100) * amount).toFixed(2)),
      }));
    }

    const expense = await Expense.create({ tripId, description, amount, paidBy, category, splitType, splitBetween: splits });
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/expense/:tripId
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ tripId: req.params.tripId }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/expense/:id
const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/expense/settlement/:tripId
const getSettlement = async (req, res) => {
  try {
    const expenses = await Expense.find({ tripId: req.params.tripId });
    const balances = {};

    expenses.forEach(({ paidBy, amount, splitBetween }) => {
      // Payer gets credit
      balances[paidBy] = (balances[paidBy] || 0) + amount;
      // Each member owes their share
      splitBetween.forEach(({ member, amount: share }) => {
        balances[member] = (balances[member] || 0) - (share || 0);
      });
    });

    // Greedy settlement algorithm
    const creditors = Object.entries(balances).filter(([, v]) => v > 0.005).map(([name, amount]) => ({ name, amount }));
    const debtors   = Object.entries(balances).filter(([, v]) => v < -0.005).map(([name, amount]) => ({ name, amount: -amount }));

    const settlements = [];
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const settled = Math.min(creditors[i].amount, debtors[j].amount);
      settlements.push({ from: debtors[j].name, to: creditors[i].name, amount: parseFloat(settled.toFixed(2)) });
      creditors[i].amount -= settled;
      debtors[j].amount   -= settled;
      if (creditors[i].amount < 0.005) i++;
      if (debtors[j].amount   < 0.005) j++;
    }

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const categoryBreakdown = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    res.json({ balances, settlements, totalSpent, categoryBreakdown });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { addExpense, getExpenses, deleteExpense, getSettlement };
