
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const moment = require('moment'); // Add moment for date formatting
const { User, TaxDetails, Ward, BlockedUser } = require('./models'); // Ensure these models are correctly defined
const nodemailer = require('nodemailer');

const Payment = require('./models/payment');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/taxDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected to taxDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like 'smtp' or 'mailgun'
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});

// Fetch User and Tax Details by User ID
app.get('/taxDetails/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ userId }).populate('ward');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const taxDetails = await TaxDetails.findOne({ user: user._id });
    if (!taxDetails) {
      return res.status(404).json({ error: 'Tax details not found' });
    }

    res.json({
      user,
      taxDetails,
    });
  } catch (error) {
    console.error('Error fetching tax details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/payments', async (req, res) => {
  const { taxId, amount, taxType } = req.body;

  if (!taxId || !amount || !taxType) {
    return res.status(400).json({ error: 'Tax ID, amount, and tax type are required' });
  }

  try {
    const taxDetails = await TaxDetails.findById(taxId);
    if (!taxDetails) {
      return res.status(404).json({ error: 'Tax details not found' });
    }

    const taxTypes = ['propertyTax', 'waterTax', 'garbageTax'];
    if (!taxTypes.includes(taxType)) {
      return res.status(400).json({ error: 'Invalid tax type' });
    }

    const newAmount = taxDetails[taxType] - amount;
    if (newAmount < 0) {
      return res.status(400).json({ error: 'Payment amount exceeds outstanding amount' });
    }

    taxDetails[taxType] = newAmount;
    taxDetails.totalTax = taxDetails.propertyTax + taxDetails.waterTax + taxDetails.garbageTax;
    await taxDetails.save();

    const payment = new Payment({
      taxId,
      amount,
      taxType,
      date: moment().format('YYYY-MM-DD'),
      time: moment().format('HH:mm:ss'),
    });
    await payment.save();

    res.status(200).json({ success: true, updatedTaxDetails: taxDetails });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// Pay all taxes endpoint
app.post('/payAllTaxes', async (req, res) => {
  const { userId, propertyTaxAmount, waterTaxAmount, garbageTaxAmount } = req.body;

  if (!userId || !propertyTaxAmount || !waterTaxAmount || !garbageTaxAmount) {
    return res.status(400).send('User ID and amounts are required');
  }

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const taxDetails = await TaxDetails.findOne({ user: user._id });
    if (!taxDetails) {
      return res.status(404).send('Tax details not found');
    }

    const totalPaid = propertyTaxAmount + waterTaxAmount + garbageTaxAmount;
    if (propertyTaxAmount > taxDetails.propertyTax || waterTaxAmount > taxDetails.waterTax || garbageTaxAmount > taxDetails.garbageTax) {
      return res.status(400).send('Payment amounts exceed the outstanding tax amounts');
    }

    taxDetails.propertyTax -= propertyTaxAmount;
    taxDetails.waterTax -= waterTaxAmount;
    taxDetails.garbageTax -= garbageTaxAmount;
    taxDetails.totalTax -= totalPaid;

    // Ensure no negative values
    if (taxDetails.propertyTax < 0) taxDetails.propertyTax = 0;
    if (taxDetails.waterTax < 0) taxDetails.waterTax = 0;
    if (taxDetails.garbageTax < 0) taxDetails.garbageTax = 0;
    if (taxDetails.totalTax < 0) taxDetails.totalTax = 0;

    await taxDetails.save();

    // Generate payment receipt
    const paymentDetails = {
      userId,
      propertyTaxPaid: propertyTaxAmount,
      waterTaxPaid: waterTaxAmount,
      garbageTaxPaid: garbageTaxAmount,
      totalPaid,
      date: moment().format('YYYY-MM-DD'),
      time: moment().format('HH:mm:ss'),
    };

    res.status(200).json({ message: 'Payment processed successfully', paymentDetails });

    // Notify user
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: user.email,
      subject: 'Tax Payment Confirmation',
      text: `Your payment of ${totalPaid} has been received successfully. Thank you!`
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Generate no due receipt
app.get('/noDueReceipt/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const taxDetails = await TaxDetails.findOne({ user: user._id });
    if (!taxDetails) {
      return res.status(404).send('Tax details not found');
    }

    if (taxDetails.totalTax > 0) {
      return res.status(400).send('Outstanding taxes still exist');
    }

    const receipt = {
      userId,
      propertyTax: taxDetails.propertyTax,
      waterTax: taxDetails.waterTax,
      garbageTax: taxDetails.garbageTax,
      totalTax: taxDetails.totalTax,
      date: moment().format('YYYY-MM-DD'),
      time: moment().format('HH:mm:ss'),
    };

    res.status(200).json(receipt);
  } catch (error) {
    console.error('Error generating no due receipt:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to fetch wards
app.get('/wards', async (req, res) => {
  try {
    const wards = await Ward.find(); // Fetch wards from database
    res.json(wards);
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to fetch total remaining tax by ward
app.get('/totalRemainingTax', async (req, res) => {
  try {
    const wards = await Ward.find();
    const results = [];

    for (const ward of wards) {
      const taxDetails = await TaxDetails.find({ ward: ward._id });
      const totalRemainingTax = taxDetails.reduce((sum, details) => sum + details.totalTax, 0);
      results.push({ ward: ward.name, totalRemainingTax });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching total remaining tax:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to fetch users in a ward
app.get('/wardUsers/:wardId', async (req, res) => {
  const { wardId } = req.params;

  try {
    const users = await User.find({ ward: wardId }).populate('ward');
    const results = await Promise.all(users.map(async (user) => {
      const taxDetails = await TaxDetails.findOne({ user: user._id });
      return {
        userId: user.userId,
        name: user.name,
        propertyTax: taxDetails.propertyTax,
        waterTax: taxDetails.waterTax,
        garbageTax: taxDetails.garbageTax,
        totalTax: taxDetails.totalTax,
        isBlocked: !!(await BlockedUser.findOne({ user: user._id }))
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching users and tax details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Block a user
app.post('/blockUser', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const user = await User.findOne({ userId }).populate('ward');
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user is already blocked
    const blockedUser = await BlockedUser.findOne({ user: user._id });
    if (blockedUser) {
      return res.status(400).send('User is already blocked');
    }

    // Block the user
    const newBlockedUser = new BlockedUser({
      user: user._id,
      ward: user.ward._id,
      blockedAt: moment().format('YYYY-MM-DD HH:mm:ss')
    });
    await newBlockedUser.save();

    res.status(200).send({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Resume a blocked user
app.post('/resumeService', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const user = await User.findOne({ userId }).populate('ward');
    if (!user) {
      return res.status(404).send('User not found');
    }

    const blockedUser = await BlockedUser.findOne({ user: user._id });
    if (!blockedUser) {
      return res.status(404).send('User is not blocked');
    }

    await BlockedUser.deleteOne({ user: user._id });
    res.status(200).send({ message: 'User service resumed successfully' });
  } catch (error) {
    console.error('Error resuming user service:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Fetch blocked users by ward
app.get('/blockedUsers/:wardId', async (req, res) => {
  const { wardId } = req.params;

  try {
    const blockedUsers = await BlockedUser.find({ ward: wardId }).populate('user');
    const results = await Promise.all(blockedUsers.map(async blockedUser => {
      const taxDetails = await TaxDetails.findOne({ user: blockedUser.user._id });
      return {
        userId: blockedUser.user.userId,
        name: blockedUser.user.name,
        unpaidTaxes: {
          propertyTax: taxDetails.propertyTax,
          waterTax: taxDetails.waterTax,
          garbageTax: taxDetails.garbageTax,
        },
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Send Notification (e.g., Email)
app.post('/sendNotification', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).send('User ID and message are required');
  }

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Send notification via email
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: user.email,
      subject: 'Notification',
      text: message
    });

    res.status(200).send({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/wardTaxData', async (req, res) => {
    try {
      const taxData = await TaxDetail.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'userId',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $group: {
            _id: '$user.ward',
            propertyTax: { $sum: '$propertyTax' },
            waterTax: { $sum: '$waterTax' },
            garbageTax: { $sum: '$garbageTax' }
          }
        },
        {
          $project: {
            ward: '$_id',
            propertyTax: 1,
            waterTax: 1,
            garbageTax: 1
          }
        }
      ]);
  
      res.json(taxData);
    } catch (error) {
      console.error('Error fetching ward tax data:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
