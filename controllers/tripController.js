const Trip = require('../models/Trip');
const { generateItinerary, getBudgetSuggestions, chatAssistant } = require('../services/openaiService');

// POST /api/trip/create
const createTrip = async (req, res) => {
  try {
    const { destination, budget, numberOfPeople, duration, tripType, members, startDate, endDate } = req.body;
    const trip = await Trip.create({
      userId: req.user._id, destination, budget, numberOfPeople: numberOfPeople || 1,
      duration, tripType, members: members || [], startDate, endDate,
    });
    res.status(201).json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/trip
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/trip/:id
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/trip/:id
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/trip/:id
const deleteTrip = async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/trip/generate-itinerary
const generateTripItinerary = async (req, res) => {
  try {
    const { tripId, destination, budget, numberOfPeople, duration, tripType } = req.body;
    const itinerary = await generateItinerary({ destination, budget, numberOfPeople, duration, tripType });
    if (tripId) {
      await Trip.findByIdAndUpdate(tripId, { itinerary, destination: itinerary.destination });
    }
    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ message: 'AI generation failed: ' + err.message });
  }
};

// POST /api/trip/budget-suggestions
const getBudgetTips = async (req, res) => {
  try {
    const suggestions = await getBudgetSuggestions(req.body);
    res.json({ suggestions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/trip/chat
const chat = async (req, res) => {
  try {
    const reply = await chatAssistant(req.body);
    res.json({ reply });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createTrip, getTrips, getTripById, updateTrip, deleteTrip, generateTripItinerary, getBudgetTips, chat };
