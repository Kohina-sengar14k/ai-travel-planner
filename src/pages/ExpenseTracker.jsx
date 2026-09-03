import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTrips, addExpense, getExpenses, deleteExpense, getSettlement, getBudgetSuggestions } from '../services/api';
import BudgetAlert from '../components/BudgetAlert';

const CATEGORIES = ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'];
const CAT_EMOJI   = { food: '🍔', transport: '🚌', accommodation: '🏨', activities: '🎟️', shopping: '🛍️', other: '📦' };
const SPLIT_TYPES = ['equal', 'custom', 'percentage'];

const ExpenseTracker = () => {
  const [searchParams] = useSearchParams();
  const preselectedTrip = searchParams.get('trip');

  const [trips, setTrips]             = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(preselectedTrip || '');
  const [expenses, setExpenses]       = useState([]);
  const [settlement, setSettlement]   = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);

  const [form, setForm] = useState({
    description: '', amount: '', paidBy: '', category: 'food', splitType: 'equal',
  });
  const [formError, setFormError] = useState('');
  const [adding, setAdding]       = useState(false);

  useEffect(() => {
    getTrips().then(({ data }) => {
      setTrips(data);
      if (!preselectedTrip && data.length > 0) setSelectedTrip(data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (selectedTrip) fetchExpenseData();
  }, [selectedTrip]);

  const fetchExpenseData = async () => {
    setLoading(true);
    try {
      const [{ data: exps }, { data: settle }] = await Promise.all([
        getExpenses(selectedTrip),
        getSettlement(selectedTrip),
      ]);
      setExpenses(exps);
      setSettlement(settle);

      // Fetch AI budget suggestions if over 80%
      const trip = trips.find(t => t._id === selectedTrip);
      if (trip && settle.totalSpent > trip.budget * 0.8) {
        const topCat = Object.entries(settle.categoryBreakdown || {})
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
        try {
          const { data } = await getBudgetSuggestions({
            destination: trip.destination,
            category: topCat,
            currentSpend: settle.totalSpent,
            budget: trip.budget,
          });
          setSuggestions(data);
        } catch { setSuggestions([]); }
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.description || !form.amount || !form.paidBy)
      return setFormError('Please fill description, amount, and who paid.');
    setAdding(true);
    try {
      await addExpense({ tripId: selectedTrip, ...form, amount: Number(form.amount) });
      setForm({ description: '', amount: '', paidBy: '', category: 'food', splitType: 'equal' });
      fetchExpenseData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add expense.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    fetchExpenseData();
  };

  const currentTrip     = trips.find(t => t._id === selectedTrip);
  const totalSpent      = settlement?.totalSpent || 0;
  const budget          = currentTrip?.budget || 0;
  const pct             = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const members         = currentTrip?.members || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Expense Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Track, split, and settle trip expenses</p>
        </div>

        {/* Trip selector */}
        <select
          className="input max-w-xs"
          value={selectedTrip}
          onChange={e => setSelectedTrip(e.target.value)}
        >
          {trips.map(t => (
            <option key={t._id} value={t._id}>{t.destination} (${t.budget})</option>
          ))}
        </select>
      </div>

      {!selectedTrip && (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>Create a trip first, then track expenses here.</p>
        </div>
      )}

      {selectedTrip && (
        <>
          {/* Budget summary */}
          <div className="card">
            <div className="flex flex-wrap gap-6 items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">${budget.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-blue-600">${totalSpent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className={`text-2xl font-bold ${budget - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${(budget - totalSpent).toFixed(2)}
                </p>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Budget used</span><span>{pct.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <BudgetAlert budget={budget} spent={totalSpent} suggestions={suggestions} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Add Expense Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleAdd} className="card space-y-3">
                <h2 className="font-semibold text-gray-800">Add Expense</h2>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{formError}</div>
                )}

                <div>
                  <label className="label">Description *</label>
                  <input name="description" className="input" placeholder="e.g. Dinner at Café Roma"
                    value={form.description} onChange={onChange} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Amount (USD) *</label>
                    <input name="amount" type="number" min="0.01" step="0.01" className="input" placeholder="0.00"
                      value={form.amount} onChange={onChange} />
                  </div>
                  <div>
                    <label className="label">Paid by *</label>
                    {members.length > 0 ? (
                      <select name="paidBy" className="input" value={form.paidBy} onChange={onChange}>
                        <option value="">Select</option>
                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <input name="paidBy" className="input" placeholder="Person name"
                        value={form.paidBy} onChange={onChange} />
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select name="category" className="input" value={form.category} onChange={onChange}>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Split Type</label>
                  <div className="flex gap-2">
                    {SPLIT_TYPES.map(s => (
                      <button type="button" key={s}
                        onClick={() => setForm({ ...form, splitType: s })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors
                          ${form.splitType === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={adding} className="btn-primary w-full py-2.5">
                  {adding ? 'Adding…' : '+ Add Expense'}
                </button>
              </form>
            </div>

            {/* Expense list + Settlement */}
            <div className="lg:col-span-3 space-y-4">
              {/* Expenses */}
              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">Expenses ({expenses.length})</h2>
                {loading ? (
                  <p className="text-gray-400 text-sm text-center py-4">Loading…</p>
                ) : expenses.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No expenses yet. Add your first one!</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {expenses.map(exp => (
                      <div key={exp._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{CAT_EMOJI[exp.category]}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{exp.description}</p>
                            <p className="text-xs text-gray-400">Paid by {exp.paidBy} · {exp.splitType} split</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">${exp.amount.toFixed(2)}</span>
                          <button onClick={() => handleDelete(exp._id)}
                            className="text-red-400 hover:text-red-600 text-sm transition-colors">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category breakdown */}
              {settlement?.categoryBreakdown && Object.keys(settlement.categoryBreakdown).length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-gray-800 mb-3">Category Breakdown</h2>
                  <div className="space-y-2">
                    {Object.entries(settlement.categoryBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, amt]) => (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-lg w-6">{CAT_EMOJI[cat]}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-0.5">
                              <span className="capitalize text-gray-700">{cat}</span>
                              <span className="font-medium">${amt.toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full">
                              <div className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${totalSpent > 0 ? (amt / totalSpent) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Settlement */}
              {settlement?.settlements?.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-gray-800 mb-3">💳 Who Owes Whom</h2>
                  <div className="space-y-2">
                    {settlement.settlements.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-800">{s.from}</span>
                          <span className="text-gray-400">→ pays →</span>
                          <span className="font-semibold text-gray-800">{s.to}</span>
                        </div>
                        <span className="text-amber-700 font-bold">${s.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settlement?.settlements?.length === 0 && expenses.length > 0 && (
                <div className="card text-center py-6 text-green-600">
                  <span className="text-3xl">✅</span>
                  <p className="font-medium mt-2">All settled up! No outstanding balances.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseTracker;
