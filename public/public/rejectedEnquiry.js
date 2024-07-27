// rejectedEnquiry.js
const mongoose = require('mongoose');

const rejectedEnquirySchema = new mongoose.Schema({
  // Include the fields from your Enquiry model
  Name: String,
  mobile: String,
  email: String,
  textArea: String,
});

const RejectedEnquiry = mongoose.model('RejectedEnquiry', rejectedEnquirySchema);

module.exports = RejectedEnquiry;
