const { ADMIN_ROLE, VIEWER_ROLE, MANAGER_ROLE } = require("./userRoles");


const permissions = {
    [ADMIN_ROLE]: [
        'user:create',
        'user:update',
        'user:delete',
        'user:view',
        'group:create',
        'group:update',
        'group:delete',
        'group:view',
        'payment:create'
    ],

    [VIEWER_ROLE]: [
        'user:view',
        'group:view'
    ],

    [MANAGER_ROLE]: [
        'user:view',
        'group:create',
        'group:update',
        'group:view'
    ]
};

module.exports = permissions;