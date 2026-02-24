const permission = require('../utility/permission');
const userDao = require('../dao/userDao');

const authorize = (requiredPermission) => {
    
    return async (request, response, next) => {
        // AuthMiddleware must run before this middleware so that
        // we can have access to user object.
        const user = request.user;

        if (!user) {
            return response.status(401).json({ message: 'Unauthorized access '});
        }

        // If role is missing from JWT (old token), fetch from database
        let userRole = user.role;
        if (!userRole && user.email) {
            try {
                const dbUser = await userDao.findByEmail(user.email);
                userRole = dbUser?.role;
            } catch (error) {
                console.log('Error fetching user role from database:', error);
            }
        }

        const userPermissions = permission[userRole] || [];
        if (!userPermissions.includes(requiredPermission)) {
            return response.status(403).json({
                message: 'Forbidden: Insufficient Permissions'
            });
        }

        next();
    }
};

module.exports = authorize;