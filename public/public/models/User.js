const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  isBlocked: { type: Boolean, default: false }, // New field
  paymentDeadline: { type: Date, default: null }, // New field
});

const User = mongoose.model('User', userSchema);
module.exports = User;
