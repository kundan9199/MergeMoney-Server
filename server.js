require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');

const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');
const paymentsRoutes = require('./src/routes/paymentsRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');

// Clear old logs
fs.writeFileSync('./request-logs.txt', '=== Server Started ===\n');
function logToFile(msg) {
    fs.appendFileSync('./request-logs.txt', msg + '\n');
    console.log(msg);
}

logToFile('');
logToFile('[SERVER] Initializing...');

mongoose.connect(process.env.MONGO_DB_CONNECTION_URL)
    .then(() => logToFile('MongoDB Connected🚀'))
    .catch((error) => logToFile('Error Connecting to Database: ' + error));

// CORS configuration to allow multiple origins
const corsOption = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174'
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-rtb-fingerprint-id'],
    exposedHeaders: ['x-rtb-fingerprint-id']
};

const app = express();

app.use(cors(corsOption));
app.use(express.json()); // Middleware
app.use(cookieParser()); // Middleware

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/users', rbacRoutes);
app.use('/payments', paymentsRoutes);
app.use('/profile', profileRoutes);
app.use('/expenses', expenseRoutes);

app.listen(5001, () => {
    logToFile('Server is running on port 5001');
});