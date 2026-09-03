const router = require('express').Router();
const { addExpense, getExpenses, deleteExpense, getSettlement } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);

// settlement BEFORE :tripId to avoid route conflict
router.get('/settlement/:tripId', getSettlement);
router.post('/add', addExpense);
router.get('/:tripId', getExpenses);
router.delete('/:id', deleteExpense);

module.exports = router;
