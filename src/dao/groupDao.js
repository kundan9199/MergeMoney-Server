const Group = require("../model/group");

const groupDao = {
    createGroup: async (data) => {
        const newGroup = new Group(data);
        return await newGroup.save();
    },

    updateGroup: async (data) => {
        const { groupId, name, description, thumbnail, adminEmail, paymentStatus } = data;

        return await Group.findByIdAndUpdate(groupId, {
            name, description, thumbnail, adminEmail, paymentStatus,
        }, { new: true });
    },

    addMembers: async (groupId, ...membersEmails) => {
        return await Group.findByIdAndUpdate(groupId, {
            $addToSet: { membersEmail: { $each: membersEmails }}
        }, { new: true });
    },

    removeMembers: async (groupId, ...membersEmails) => {
        return await Group.findByIdAndUpdate(groupId, {
            $pull: { membersEmail: { $in: membersEmails } }
        }, { new: true });
    },

    getGroupByEmail: async (email) => {
        return await Group.find({ membersEmail: email });
    },

    getGroupById: async (groupId) => {
        console.log(`[DAO] Querying group by ID: ${groupId}`);
        const result = await Group.findById(groupId);
        console.log(`[DAO] Query result:`, result ? `Found group: ${result.name}` : `No group found`);
        return result;
    },

    getGroupByStatus: async (status) => {
        // Take email as the input, then filter groups by email
        // Check in membersEmail field.
        return await Group.find({ "paymentStatus.isPaid": status });
    },

    /**
     * We'll only return when was the last time group
     * was settled to begin with.
     * In future, we can move this to separate entity!
     * @param {*} groupId 
     */
    getAuditLog: async (groupId) => {
        // Based on your schema, the most relevant "settled" info 
        // is the date within paymentStatus.
        const group = await Group.findById(groupId).select('paymentStatus.date');
        return group ? group.paymentStatus.date : null;
    },

    // Default sorting order of createdAt is descending order (-1)
    getGroupsPaginated: async (email, limit, skip, sortOptions = { createdAt: -1 }) => {
        const [groups, totalCount] = await Promise.all([
            // Find groups with given email,
            // sort them to preserve order across
            // pagination requests, and then perform
            // skip and limit to get results of desired page.
            Group.find({ membersEmail: email })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            
            // Count how many records are there in the collection
            // with the given email
            Group.countDocuments({ membersEmail: email }), 
        ]);

        return { groups, totalCount };
    },
};

module.exports = groupDao;