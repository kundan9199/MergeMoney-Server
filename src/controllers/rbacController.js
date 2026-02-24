const bcrypt = require('bcryptjs');
const rbacDao = require("../dao/rbacdao");
const { generateTemporaryPassword } = require("../utility/passwordUtil");
const emailService = require('../services/emailService');
const { USER_ROLES } = require('../utility/userRoles');

const rbacController = {
    create: async (request, response) => {
        try {
            const adminUser = request.user;
            const { name, email, role } = request.body;

            if (!USER_ROLES.includes(role)) {
                return response.status(400).json({
                    message: 'Invalid role'
                });
            }

            const tempPassword = generateTemporaryPassword(8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);

            const user = await rbacDao.create(email, name, role, hashedPassword, adminUser._id);

            try {
                await emailService.send(
                    email, 'Temporary Password', 
                    `Your temporary password is: ${tempPassword}`
                );
            } catch (error) {
                // Let the create user call succeed even though sending email
                // failed. We can offer re-trigger sending temporary password
                // functionality to the admins.
                console.log(`Error sending email, temporary password is ${tempPassword}`, error);
            }
            
            return response.status(200).json({
                message: 'User created!',
                user: user
            });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    update: async (request, response) => {
        try {
            const { name, role, userId } = request.body;
            const user = await rbacDao.update(userId, name, role);
            return response.status(200).json({
                message: 'User updated!',
                user: user
            });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    delete: async (request, response) => {
        try {
            const { userId } = request.body;
            await rbacDao.delete(userId);
            return response.status(200).json({
                message: 'User deleted!'
            });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    getAllUsers: async (request, response) => {
        try {
            const adminId = request.user._id;
            const users = await rbacDao.getUsersByAdminId(adminId);
            return response.status(200).json({
                users: users
            });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = rbacController;