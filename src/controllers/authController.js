const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');

const authController = {
    login: async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({
                errors: errors.array()
            });
        }
        
        const { email, password } = request.body;

        try {
            const user = await userDao.findByEmail(email);

            if (!user) {
                return response.status(400).json({
                    message: 'Invalid email or password'
                });
            }

            const isPasswordMatched = await bcrypt.compare(password, user.password);
            if (isPasswordMatched) {
                const token = jwt.sign({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    id: user._id
                }, process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                response.cookie('jwtToken', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Lax',
                    path: '/'
                });
                return response.status(200).json({
                    message: 'User authenticated',
                    user: user
                });
            } else {
                return response.status(400).json({
                    message: 'Invalid email or password'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    register: async (request, response) => {
        const { name, email, password } = request.body;

        if (!name || !email || !password) {
            return response.status(400).json({
                message: 'Name, Email, Password are required'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        userDao.create({
            name: name,
            email: email,
            password: hashedPassword
        })
            .then(u => {
                return response.status(200).json({
                    message: 'User registered',
                    user: { id: u._id }
                });
            })
            .catch(error => {
                if (error.code === 'USER_EXIST') {
                    console.log(error);
                    return response.status(400).json({
                        message: 'User with the email already exist'
                    });
                } else {
                    return response.status(500).json({
                        message: "Internal server error"
                    });
                }
            });
    },

    isUserLoggedIn: async (request, response) => {
        try {
            const token = request.cookies?.jwtToken;

            if (!token) {
                return response.status(401).json({
                    message: 'Unauthorized access'
                });
            }

            jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
                if (error) {
                    return response.status(401).json({
                        message: 'Invalid token'
                    });
                } else {
                    response.json({
                        user: user
                    });
                }

            });
        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    logout: async (request, response) => {
        try {
            response.clearCookie('jwtToken');
            response.json({ message: 'Logout successfull' });
        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    googleSso: async (request, response) => {
        console.log('=== Google SSO Request Received ===');
        try {
            const { idToken } = request.body;
            console.log('idToken present:', !!idToken);
            
            if (!idToken) {
                console.error('No idToken provided in request');
                return response.status(400).json({ message: 'Invalid request - no idToken' });
            }

            console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'NOT SET');
            if (!process.env.GOOGLE_CLIENT_ID) {
                console.error('GOOGLE_CLIENT_ID is not set in environment variables');
                return response.status(500).json({ message: 'Server configuration error: Missing GOOGLE_CLIENT_ID' });
            }

            console.log('Creating OAuth2Client...');
            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            
            let googleResponse;
            try {
                console.log('Verifying idToken with Google...');
                googleResponse = await googleClient.verifyIdToken({
                    idToken: idToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                console.log('Token verified successfully');
            } catch (tokenError) {
                console.error('Google token verification error:', tokenError.message);
                console.error('Error stack:', tokenError.stack);
                console.error('Full error:', tokenError);
                return response.status(401).json({ 
                    message: 'Failed to verify Google token: ' + tokenError.message 
                });
            }

            if (!googleResponse) {
                console.error('Google response is null');
                return response.status(401).json({ message: 'Failed to verify Google token' });
            }

            console.log('Getting payload from response...');
            const payload = googleResponse.getPayload();
            const { sub: googleId, name, email } = payload;
            console.log('Payload extracted - googleId:', !!googleId, 'email:', email);

            if (!googleId || !email) {
                console.error('Missing required fields in Google payload');
                return response.status(401).json({ message: 'Invalid Google token payload' });
            }

            try {
                console.log('Finding user with email:', email);
                let user = await userDao.findByEmail(email);
                if (!user) {
                    console.log('User not found, creating new user...');
                    user = await userDao.create({
                        name: name || 'Google User',
                        email: email,
                        googleId: googleId,
                        password: null  // No password for Google auth users
                    });
                    console.log('User created successfully:', user._id);
                } else if (!user.googleId) {
                    // Update existing user with googleId if not already set
                    console.log('Updating existing user with googleId');
                    user.googleId = googleId;
                    await user.save();
                    console.log('User updated successfully');
                } else {
                    console.log('User already exists and has googleId');
                }

                console.log('Creating JWT token...');
                const token = jwt.sign({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    googleId: user.googleId,
                    id: user._id
                }, process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                console.log('Setting cookie and returning response...');
                response.cookie('jwtToken', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Lax',
                    path: '/'
                });
                return response.status(200).json({
                    message: 'User authenticated',
                    user: user
                });
            } catch (dbError) {
                console.error('Database error in Google SSO:', dbError.message);
                console.error('Error stack:', dbError.stack);
                return response.status(500).json({
                    message: 'Error processing user data: ' + dbError.message
                });
            }

        } catch (error) {
            console.error('=== Google SSO error ===');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);
            return response.status(500).json({
                message: 'Failed to authenticate with Google: ' + error.message
            });
        }
    },

    forgotPassword: async (request, response) => {
        try {
            const { email } = request.body;

            if (!email) {
                return response.status(400).json({
                    message: 'Email is required'
                });
            }

            const user = await userDao.findByEmail(email);

            if (!user) {
                return response.status(400).json({
                    message: 'No account found with this email'
                });
            }

            // Generate a 6-digit reset code
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Store the reset code in the database
            user.resetToken = resetCode;
            user.resetTokenExpiry = resetTokenExpiry;
            await user.save();

            // In a real app, you would send this via email
            console.log(`Reset code for ${email}: ${resetCode}`);

            return response.status(200).json({
                message: 'Reset code sent to your email',
                // For demo purposes, return the code. Remove this in production!
                resetCode: resetCode
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            return response.status(500).json({
                message: 'Error processing forgot password request'
            });
        }
    },

    resetPassword: async (request, response) => {
        try {
            const { email, resetCode, newPassword, confirmPassword } = request.body;

            if (!email || !resetCode || !newPassword || !confirmPassword) {
                return response.status(400).json({
                    message: 'Email, reset code, and password are required'
                });
            }

            if (newPassword !== confirmPassword) {
                return response.status(400).json({
                    message: 'Passwords do not match'
                });
            }

            if (newPassword.length < 6) {
                return response.status(400).json({
                    message: 'Password must be at least 6 characters'
                });
            }

            const user = await userDao.findByEmail(email);

            if (!user) {
                return response.status(400).json({
                    message: 'No account found with this email'
                });
            }

            // Check if reset code is correct and not expired
            if (user.resetToken !== resetCode) {
                return response.status(400).json({
                    message: 'Invalid reset code'
                });
            }

            if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
                return response.status(400).json({
                    message: 'Reset code has expired. Please request a new one.'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update user password and clear reset token
            user.password = hashedPassword;
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await user.save();

            return response.status(200).json({
                message: 'Password reset successfully'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            return response.status(500).json({
                message: 'Error resetting password'
            });
        }
    },
};

module.exports = authController;