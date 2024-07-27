const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  owner: { type: String, required: true },
  address: { type: String, required: true },
  area: { type: Number, required: true },
  propertyValue: { type: Number, required: true },
  uniqueId: { type: String, unique: true, required: true }
});

const Property = mongoose.model('Property', PropertySchema);

module.exports = Property;
