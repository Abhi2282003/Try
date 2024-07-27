const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  taxId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxDetails' },
  amount: Number,
  taxType: String,
  date: String,
  time: String,
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
