const mongoose = require('mongoose');

const acceptedRejectedEnquirySchema = new mongoose.Schema({
  // Copy the fields from your existing Enquiry schema
  Name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  textArea: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['accepted', 'rejected'],
    required: true,
  },
});

const AcceptedRejectedEnquiry = mongoose.model('AcceptedRejectedEnquiry', acceptedRejectedEnquirySchema);

module.exports = AcceptedRejectedEnquiry;
