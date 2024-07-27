// seedData.js
const mongoose = require('mongoose');
const { User, TaxDetails, Ward } = require('./models'); // Adjust the path if needed

mongoose.connect('mongodb://127.0.0.1:27017/taxDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected to taxDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const createSampleData = async () => {
  try {
    // Clear existing data
    await Ward.deleteMany({});
    await User.deleteMany({});
    await TaxDetails.deleteMany({});

    const wards = [];
    const users = [];

    // Create 4 Wards
    for (let w = 1; w <= 4; w++) {
      const ward = new Ward({ name: `Tax Payers Ward ${w}` });
      await ward.save();
      wards.push(ward);

      // Create 10 Users per Ward
      for (let i = 1; i <= 10; i++) {
        const userId = ('0000' + (w * 10 + i)).slice(-4); // Generate 4-digit user ID
        const user = new User({
          name: `User ${w * 10 + i}`,
          mobile: `+123456789${w * 10 + i}`,
          email: `user${w * 10 + i}@example.com`,
          userId,
          wardId: ward._id
        });
        await user.save();
        users.push(user);
      }

      // Assign users to the ward
      ward.users = users.filter(user => user.wardId.toString() === ward._id.toString()).map(user => user._id);
      await ward.save();
    }

    // Create tax details for each user
    for (const user of users) {
      const taxDetails = new TaxDetails({
        userId: user._id,
        propertyTax: Math.floor(Math.random() * 1000) + 100, // Random amount between 100 and 1100
        waterTax: Math.floor(Math.random() * 500) + 50, // Random amount between 50 and 550
        garbageTax: Math.floor(Math.random() * 200) + 20 // Random amount between 20 and 220
      });
      await taxDetails.save();
    }

    console.log('Sample data created successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating sample data:', error);
    mongoose.connection.close();
  }
};

createSampleData();
