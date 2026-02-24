const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Specific routes FIRST (non-parameterized)
router.post('/create', authorizeMiddleware('group:create'), groupController.create);
router.get('/my-groups', authorizeMiddleware('group:view'), groupController.getGroupsByUser);
router.get('/status', authorizeMiddleware('group:view'), groupController.getGroupsByPaymentStatus);
router.put('/update', authorizeMiddleware('group:update'), groupController.update);
router.patch('/members/add', authorizeMiddleware('group:update'), groupController.addMembers);
router.patch('/members/remove', authorizeMiddleware('group:update'), groupController.removeMembers);

// Parameterized routes LAST
router.get('/:groupId/audit', authorizeMiddleware('group:view'), groupController.getAudit);
router.get('/:groupId', authorizeMiddleware('group:view'), groupController.getGroupById);

module.exports = router;