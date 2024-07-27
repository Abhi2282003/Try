const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tax Details Schema
const taxDetailsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyTax: { type: Number, default: 0 },
  waterTax: { type: Number, default: 0 },
  garbageTax: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  dueDate: { type: Date },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ward Schema
const wardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Blocked User Schema
const blockedUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  reason: { type: String, default: 'Non-payment' },
  blockedAt: { type: Date, default: Date.now },
  unblockedAt: { type: Date }
});

const User = mongoose.model('User', userSchema);
const TaxDetails = mongoose.model('TaxDetails', taxDetailsSchema);
const Ward = mongoose.model('Ward', wardSchema);
const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);

module.exports = { User, TaxDetails, Ward, BlockedUser };
