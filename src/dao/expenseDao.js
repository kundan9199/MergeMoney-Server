const Expense = require('../model/expense');

const expenseDao = {
    createExpense: async (expenseData) => {
        try {
            const newExpense = new Expense(expenseData);
            return await newExpense.save();
        } catch (error) {
            console.log(error);
            throw {
                error: 'Failed to create expense'
            };
        }
    },

    getExpenseById: async (expenseId) => {
        try {
            return await Expense.findById(expenseId);
        } catch (error) {
            console.log(error);
            throw {
                message: 'Internal server error'
            };
        }
    },

    getExpensesByGroup: async (groupId) => {
        try {
            return await Expense.find({ groupId }).sort({ createdAt: -1 });
        } catch (error) {
            console.log(error);
            throw {
                message: 'Failed to fetch expenses'
            };
        }
    },

    updateExpense: async (expenseId, updateData) => {
        try {
            return await Expense.findByIdAndUpdate(expenseId, updateData, { new: true });
        } catch (error) {
            console.log(error);
            throw {
                message: 'Failed to update expense'
            };
        }
    },

    deleteExpense: async (expenseId) => {
        try {
            const result = await Expense.findByIdAndDelete(expenseId);
            return result ? true : false;
        } catch (error) {
            console.log(error);
            throw {
                message: 'Failed to delete expense'
            };
        }
    },

    calculateGroupSettlement: async (groupId) => {
        try {
            const expenses = await Expense.find({ groupId });
            
            // Calculate who owes whom
            const settlement = {};
            
            expenses.forEach(expense => {
                expense.splits.forEach(split => {
                    const debtor = split.memberEmail;
                    const creditor = expense.paidBy;
                    const amount = split.amountOwed;
                    
                    // Skip if person paid for themselves
                    if (debtor === creditor) return;
                    
                    const key = `${debtor}-${creditor}`;
                    settlement[key] = (settlement[key] || 0) + amount;
                });
            });
            
            return settlement;
        } catch (error) {
            console.log(error);
            throw {
                message: 'Failed to calculate settlement'
            };
        }
    }
};

module.exports = expenseDao;