// models/Tax.js
const mongoose = require('mongoose');

const TaxSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  amount: { type: Number, required: true },
  taxYear: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  paymentToken: { type: String, unique: true }
});

module.exports = mongoose.model('Tax', TaxSchema);
