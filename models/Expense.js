const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  member:     { type: String },
  amount:     { type: Number },
  percentage: { type: Number },
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  tripId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  description: { type: String, required: true },
  amount:      { type: Number, required: true },
  paidBy:      { type: String, required: true },
  category: {
    type: String,
    enum: ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'],
    default: 'other',
  },
  splitType:    { type: String, enum: ['equal', 'custom', 'percentage'], default: 'equal' },
  splitBetween: [splitSchema],
  date:         { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
