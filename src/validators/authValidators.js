const { body } = require('express-validator');

const loginValidators = [
    body('email')
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Provided email is not valid"),
    body('password')
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 3 }).withMessage("Password must be atleast 3 character long")
];

module.exports = {
    loginValidators
};