const mongoose = require('mongoose');

const dailyPlanSchema = new mongoose.Schema({
  day:           { type: Number },
  activities:    [{ type: String }],
  estimatedCost: { type: String },
}, { _id: false });

const tripSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination:    { type: String, required: true },
  budget:         { type: Number, required: true },
  numberOfPeople: { type: Number, default: 1 },
  duration:       { type: Number, required: true }, // number of days
  tripType:       { type: String, enum: ['budget', 'luxury', 'adventure', 'chill'], default: 'budget' },
  members:        [{ type: String }],               // list of member names
  itinerary: {
    destination:      String,
    totalBudget:      String,
    dailyPlan:        [dailyPlanSchema],
    hotelSuggestions: [String],
    foodSuggestions:  [String],
  },
  status:    { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
  startDate: { type: Date },
  endDate:   { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
