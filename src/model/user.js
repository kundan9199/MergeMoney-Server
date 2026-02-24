const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    subscriptionId: { type: String }, // Razorpay subscription id
    planId: { type: String }, // PlanId to which user subscribed (monthly/yearly)
    status: { type: String }, // Status of the subscription (created, activated, authenticated, etc.)
    start: { type: Date }, // Start date of the subscription.
    end: { type: Date }, // End date of the subscription.
    lastBillDate: { type: Date }, // The date when user made the last payment.
    nextBillDate: { type: Date }, // The next date on which will be charged again.
    paymentsMade: { type: Number }, // Number of payments made in the subscription.
    paymentsRemaining: {type: Number } // Number of payments remaining in the subscription.
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
    role: { type: String, required: true, default: 'admin' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    // Default to 1 to give free trail of creating 1 group
    credits: { type: Number, default: 1 },
    subscription: { type: subscriptionSchema, required: false }
});

module.exports = mongoose.model('User', userSchema);