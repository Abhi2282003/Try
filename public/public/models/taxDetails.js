const mongoose = require('mongoose');

const taxDetailsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  propertyTax: { type: Number, required: true },
  waterTax: { type: Number, required: true },
  garbageTax: { type: Number, required: true },
  totalTax: { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema({
  taxId: { type: mongoose.Schema.Types.ObjectId, ref: 'taxDetails', required: true },
  amount: { type: Number, required: true },
  taxType: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
});

const TaxDetails = mongoose.model('taxDetails', taxDetailsSchema);
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { TaxDetails, Payment };
