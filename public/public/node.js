const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Initialize Express app
const app = express();
const port = 3000;

// Mongoose Models
const Property = require('./models/Property');
const Tax = require('./models/Tax');
const Payment = require('./models/Payment');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/propertyTaxDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected to propertyTaxDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Tax calculation function
function calculatePropertyTax(property) {
  const baseValue = 1; // Example base value per sq meter
  const ageFactor = 1; // Example factor based on age
  const typeFactor = 1; // Example factor based on type of building
  const categoryFactor = 1; // Example factor based on category of use
  const floorFactor = 1; // Example factor based on floor

  return baseValue * property.area * ageFactor * typeFactor * categoryFactor * floorFactor;
}

// Add Property and Calculate Tax
app.post('/properties', async (req, res) => {
  const { owner, address, area, propertyValue } = req.body;

  try {
    // Create new property
    const newProperty = new Property({
      owner,
      address,
      area,
      propertyValue
    });
    await newProperty.save();

    // Calculate tax
    const taxAmount = calculatePropertyTax(newProperty);

    // Create tax record
    const newTax = new Tax({
      propertyId: newProperty._id,
      amount: taxAmount,
      paid: false // Initially, tax is not paid
    });
    await newTax.save();

    res.status(201).json({ property: newProperty, tax: newTax });
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const pdf = require('pdfkit');
const fs = require('fs');
const path = require('path');
const app = express();

app.get('/noDueReceipt/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch data from your database
    const user = await getUserDetails(userId);
    const taxDetails = await getTaxDetails(userId);

    const doc = new pdf();
    const filename = `NoDueReceipt_${userId}.pdf`;

    // Set headers to indicate the content is a PDF
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/pdf');
    
    doc.pipe(res);

    // Add Logo
    const logoPath = path.join(__dirname, 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, { width: 100, align: 'center' });
    } else {
      console.warn('Logo file not found.');
    }
    
    doc.fontSize(16).text('No Due Receipt', { align: 'center' });

    doc.fontSize(12).text(`Certificate Number: ${userId}`, { align: 'left' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`);
    doc.text(`Address: ${user.address}`);
    doc.text(`Name: ${user.name}`);
    doc.text(`Mobile: ${user.mobile}`);
    doc.text(`Email: ${user.email}`);
    
    doc.text('Tax Details:', { underline: true });
    doc.text(`Property Tax: ${taxDetails.propertyTax}`);
    doc.text(`Water Tax: ${taxDetails.waterTax}`);
    doc.text(`Garbage Tax: ${taxDetails.garbageTax}`);
    doc.text(`Total Tax: ${taxDetails.totalTax}`);
    
    doc.text('Payment Details:', { underline: true });
    doc.text(`Amount Paid: ${taxDetails.totalTax}`);
    doc.text(`Date of Payment: ${new Date().toLocaleDateString()}`);
    doc.text(`Time of Payment: ${new Date().toLocaleTimeString()}`);
    
    doc.fontSize(10).text('Thank you for your payment!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal Server Error');
  }
});
