// Example BlockedUser model
const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  blockedAt: { type: String, required: true },
});

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);
module.exports = { BlockedUser };
