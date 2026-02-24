const express = require("express");
const authController = require("../controllers/authController");
const { loginValidators } = require("../validators/authValidators");

const router = express.Router();

router.post("/login", loginValidators, authController.login);
router.post("/register", authController.register);
router.post("/is-user-logged-in", authController.isUserLoggedIn);
router.post("/logout", authController.logout);
router.post("/google-auth", authController.googleSso);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
