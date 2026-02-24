const User = require('../model/user');

const rbacDao = {
    create: async (email, name, role, password, adminId) => {
        return await User.create({
            email: email,
            password: password,
            name: name,
            role: role,
            adminId: adminId
        });
    },

    update: async (userId, name, role) => {
        return await User.findByIdAndUpdate(
            userId,
            { name, role },
            { new: true }
        );
    },

    delete: async (userId) => {
        return await User.findByIdAndDelete(userId);
    },

    getUsersByAdminId: async (adminId) => {
        return await User.find({ adminId }).select("-password");
    }
};

module.exports = rbacDao;