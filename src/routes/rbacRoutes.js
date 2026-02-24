const express = require('express');
const rbacController = require('../controllers/rbacController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/', authorizeMiddleware('user:create'), rbacController.create);
router.patch('/', authorizeMiddleware('user:update'), rbacController.update);
router.post('/delete', authorizeMiddleware('user:delete'), rbacController.delete);
router.get('/', authorizeMiddleware('user:view'), rbacController.getAllUsers);

module.exports = router;