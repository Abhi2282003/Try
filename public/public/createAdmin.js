// createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Admin } = require('./models'); // Ensure this path is correct

const adminUsername = 'abhi';
const adminPassword = 'indore';

async function createAdmin() {
  try {
    // Connect to MongoDB without deprecated options
    await mongoose.connect('mongodb://127.0.0.1:27017/taxDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the admin
    const admin = new Admin({
      username: adminUsername,
      password: hashedPassword,
    });

    // Save to database
    await admin.save();

    console.log('Admin created successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin();
