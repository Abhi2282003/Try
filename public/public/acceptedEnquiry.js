// acceptedEnquiry.js
const mongoose = require('mongoose');

const acceptedEnquirySchema = new mongoose.Schema({
  // Include the fields from your Enquiry model
  Name: String,
  mobile: String,
  email: String,
  textArea: String,
});

const AcceptedEnquiry = mongoose.model('AcceptedEnquiry', acceptedEnquirySchema);

module.exports = AcceptedEnquiry;
