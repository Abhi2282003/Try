const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/indore', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define User Schema and Model
const userSchema = new mongoose.Schema({
    userId: String,
    name: String,
    mobile: String,
    email: String,
    ward: String,
    address: String,
    propertyDescription: String,
    propertyTax: Number,
    waterTax: Number,
    garbageTax: Number,
    remainingAmount: { type: Number, default: 0 },
    username: String,
    password: String,
    role: String // 'admin', 'user', 'service'
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Create some initial users for testing
const createInitialUsers = async () => {
    const hashedPassword = await bcrypt.hash('indore', 10);

    const admin = new User({ username: 'hack', password: hashedPassword, role: 'admin' });
    const serviceProvider = new User({ username: 'service', password: hashedPassword, role: 'service' });

    await admin.save();
    await serviceProvider.save();
};

createInitialUsers();

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const user = await User.findOne({ username, role });
        if (!user) {
            return res.status(401).send('Invalid username or role');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid password');
        }

        const token = jwt.sign({ id: user._id, role: user.role }, 'secret_key', { expiresIn: '1h' });
        res.json({ accessToken: token });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Fetch User Details
app.get('/fetchUserDetails/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findOne({ userId: userId });
        if (user) {
            res.json(user);
        } else {
            res.json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mock Payment Endpoint
app.post('/mock-payment', async (req, res) => {
    const { userId, amount, currency, description, receipt_email } = req.body;

    console.log('Received payment request:', { userId, amount, currency, description, receipt_email });

    // Simulate payment processing
    const success = Math.random() > 0.2; // 80% chance of success

    if (success) {
        try {
            // Find the user and update their remaining amount
            const user = await User.findOne({ userId: userId });
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            // Calculate the new remaining amount
            const totalTax = user.propertyTax + user.waterTax + user.garbageTax;
            const remainingAmount = user.remainingAmount - amount;

            // Update the remaining amount in the database
            user.remainingAmount = remainingAmount > 0 ? remainingAmount : 0;
            await user.save();

            res.json({ success: true, remainingAmount: user.remainingAmount });
        } catch (error) {
            console.error('Error updating payment:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    } else {
        res.json({ success: false, message: 'Insufficient funds or payment error.' });
    }
});

// Chatbot Endpoint
app.post('/chatbot', (req, res) => {
    const { message } = req.body;
    
    let response;
    
    switch (message.toLowerCase()) {
        case 'hello':
            response = 'Hello! How can I assist you today?';
            break;
        case 'payment status':
            response = 'To check your payment status, please provide your User ID.';
            break;
        case 'user details':
            response = 'Please provide your User ID to fetch your details.';
            break;
        default:
            response = 'I\'m sorry, I didn\'t understand that. Could you please rephrase?';
            break;
    }
    
    res.json({ response });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
