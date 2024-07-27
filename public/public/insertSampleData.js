const mongoose = require('mongoose');
const { User, TaxDetails, Ward } = require('./models');

mongoose.connect('mongodb://127.0.0.1:27017/taxDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected to taxDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'];

const generateUserData = async () => {
  try {
    await User.deleteMany({});
    await TaxDetails.deleteMany({});
    await Ward.deleteMany({});

    const wardIds = [];
    for (const wardName of wards) {
      const ward = new Ward({ name: wardName });
      await ward.save();
      wardIds.push(ward._id);
    }

    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 10; j++) {
        const userId = (i * 1000 + j).toString().padStart(4, '0');
        const user = new User({
          name: `User ${userId}`,
          mobile: `12345678${userId}`,
          email: `user${userId}@example.com`,
          ward: wardIds[i - 1],
          userId,
        });
        await user.save();

        const taxDetails = new TaxDetails({
          user: user._id,
          propertyTax: 1000,
          waterTax: 500,
          garbageTax: 300,
          totalTax: 1800,
        });
        await taxDetails.save();
      }
    }

    console.log('Sample data inserted successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error inserting sample data:', error);
    mongoose.connection.close();
  }
};

generateUserData();
