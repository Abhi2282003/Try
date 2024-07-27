const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const JWT_SECRET = '1615c71c8819747c9fb2122d602df8a3b98fdc10a1400da95c6dbc626e9f7257';

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/indore', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
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
});

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initial Admin User
async function createInitialAdmin() {
    const adminExists = await Admin.findOne({ username: 'Hack' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('indore', 10);
        const newAdmin = new Admin({ username: 'Hack', password: hashedPassword });
        await newAdmin.save();
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }
}
createInitialAdmin();

// Authentication Middleware
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).send('Cannot find user');

    try {
        if (await bcrypt.compare(password, admin.password)) {
            const user = { name: admin.username };
            const accessToken = jwt.sign(user, JWT_SECRET);
            res.json({ accessToken });
        } else {
            res.send('Not Allowed');
        }
    } catch {
        res.status(500).send();
    }
});

// Fetch User Details
app.get('/fetchUserDetails/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findOne({ userId });
        if (user) {
            res.json(user);
        } else {
            res.json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mock Payment Route
app.post('/mock-payment', authenticateToken, async (req, res) => {
    const { userId, amount, currency, description, receipt_email } = req.body;

    console.log('Received payment request:', { userId, amount, currency, description, receipt_email });

    const success = Math.random() > 0.2; // 80% chance of success

    if (success) {
        try {
            const user = await User.findOne({ userId });

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const remainingAmount = user.remainingAmount - amount;
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

// Chatbot Route
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
