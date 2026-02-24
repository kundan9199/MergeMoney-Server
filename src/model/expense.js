const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    groupId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Group', 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: false 
    },
    amount: { 
        type: Number, 
        required: true,
        min: 0
    },
    currency: { 
        type: String, 
        default: 'INR' 
    },
    paidBy: { 
        type: String, 
        required: true 
    },
    splits: [
        {
            memberEmail: { 
                type: String, 
                required: true 
            },
            amountOwed: { 
                type: Number, 
                required: true,
                min: 0
            }
        }
    ],
    createdBy: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Expense', expenseSchema);