const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  Name: String,
  mobile: String,
  email: String,
  textArea: String,
  status: String,
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;
