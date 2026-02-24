const groupDao = require("../dao/groupDao");
const userDao = require("../dao/userDao");

const groupController = {

    create: async (request, response) => {
        try {
            const user = request.user;
            const { name, description, membersEmail, thumbnail } = request.body;

            const userInfo = await userDao.findByEmail(user.email);
            
            // This is to ensure backward compatibility for already created users
            // not having credits attribute.
            if (userInfo.credits === undefined) {
                userInfo.credits = 1;
            }

            if (Number(userInfo.credits) === 0) {
                return response.status(400).json({
                    message: 'You do not have enough credits to perform this operation'
                });
            }

            let allMembers = [user.email];
            if (membersEmail && Array.isArray(membersEmail)) {
                allMembers = [...new Set([...allMembers, ...membersEmail])];
            }

            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                membersEmail: allMembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false
                }
            });

            userInfo.credits -= 1;
            userInfo.save();

            response.status(201).json({
                message: 'Group created successfully',
                groupId: newGroup._id
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    update: async (request, response) => {
        try {
            const updatedGroup = await groupDao.updateGroup(request.body);
            if (!updatedGroup) {
                return response.status(404).json({ message: "Group not found" });
            }
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error updating group" });
        }
    },

    getGroupById: async (request, response) => {
        try {
            const { groupId } = request.params;
            console.log('[CONTROLLER] Getting group by ID:', groupId);
            
            if (!groupId) {
                console.log('[CONTROLLER] No groupId provided');
                return response.status(400).json({ message: "Group ID is required" });
            }
            
            const group = await groupDao.getGroupById(groupId);
            console.log('[CONTROLLER] Query completed. Group found:', group ? 'YES' : 'NO');
            
            if (!group) {
                console.log('[CONTROLLER] Group not found for ID:', groupId);
                return response.status(404).json({ message: "Group not found" });
            }
            
            response.status(200).json(group);
        } catch (error) {
            console.error('[CONTROLLER] Error fetching group:', error);
            response.status(500).json({ message: "Error fetching group", error: error.message });
        }
    },

    addMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.addMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error adding members" });
        }
    },

    removeMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.removeMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error removing members" });
        }
    },

    getGroupsByUser: async (request, response) => {
        try {
            const email = request.user.email;

            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const skip = (page - 1) * limit;

            const sortBy = request.query.sortBy || 'newest';
            let sortOptions = { createdAt: -1 };

            if (sortBy === 'oldest') {
                sortOptions = { createdAt: 1 };
            }

            const { groups, totalCount } = await groupDao.getGroupsPaginated(email, limit, skip, sortOptions);

            response.status(200).json({
                groups: groups,
                pagination: {
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount/limit),
                    currentPage: page,
                    itemsPerPage: limit
                }
            });
        } catch (error) {
            response.status(500).json({ message: "Error fetching groups" });
        }
    },

    getGroupsByPaymentStatus: async (request, response) => {
        try {
            const { isPaid } = request.query;
            const status = isPaid === 'true';
            const groups = await groupDao.getGroupByStatus(status);
            response.status(200).json(groups);
        } catch (error) {
            response.status(500).json({ message: "Error filtering groups" });
        }
    },

    getAudit: async (request, response) => {
        try {
            const { groupId } = request.params;
            const lastSettled = await groupDao.getAuditLog(groupId);
            response.status(200).json({ lastSettled });
        } catch (error) {
            response.status(500).json({ message: "Error fetching audit log" });
        }
    }
};

module.exports = groupController;