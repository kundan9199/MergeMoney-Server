const { body, param, validationResult } = require('express-validator');

const createExpenseValidators = [
    body('groupId')
        .notEmpty().withMessage('Group ID is required')
        .isMongoId().withMessage('Invalid Group ID'),
    body('title')
        .notEmpty().withMessage('Expense title is required')
        .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency')
        .optional()
        .isLength({ min: 1, max: 3 }).withMessage('Invalid currency code'),
    body('paidBy')
        .notEmpty().withMessage('Payer email is required')
        .isEmail().withMessage('Invalid payer email'),
    body('splits')
        .isArray({ min: 1 }).withMessage('At least one split is required')
        .custom((splits) => {
            if (!Array.isArray(splits)) return false;
            return splits.every(split => 
                split.memberEmail && 
                typeof split.memberEmail === 'string' &&
                split.amountOwed && 
                typeof split.amountOwed === 'number' &&
                split.amountOwed > 0
            );
        }).withMessage('Each split must have memberEmail and amountOwed > 0')
];

const updateExpenseValidators = [
    param('expenseId')
        .notEmpty().withMessage('Expense ID is required')
        .isMongoId().withMessage('Invalid Expense ID'),
    body('title')
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
    body('description')
        .optional()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency')
        .optional()
        .isLength({ min: 1, max: 3 }).withMessage('Invalid currency code'),
    body('paidBy')
        .optional()
        .isEmail().withMessage('Invalid payer email'),
    body('splits')
        .optional()
        .isArray({ min: 1 }).withMessage('At least one split is required')
        .custom((splits) => {
            if (!Array.isArray(splits)) return false;
            return splits.every(split => 
                split.memberEmail && 
                typeof split.memberEmail === 'string' &&
                split.amountOwed && 
                typeof split.amountOwed === 'number' &&
                split.amountOwed > 0
            );
        }).withMessage('Each split must have memberEmail and amountOwed > 0')
];

module.exports = {
    createExpenseValidators,
    updateExpenseValidators
};