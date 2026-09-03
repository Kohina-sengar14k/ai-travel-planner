const router = require('express').Router();
const { createTrip, getTrips, getTripById, updateTrip, deleteTrip,
        generateTripItinerary, getBudgetTips, chat } = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Note: specific routes BEFORE :id to avoid conflicts
router.post('/generate-itinerary', generateTripItinerary);
router.post('/budget-suggestions', getBudgetTips);
router.post('/chat', chat);
router.post('/create', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

module.exports = router;
