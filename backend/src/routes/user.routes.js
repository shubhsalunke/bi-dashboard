const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize, ROLES } = require('../middleware/auth');

const router = express.Router();

// User management is strictly restricted to Administrators
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/', userController.getUsers);
router.get('/audit-logs', userController.getAuditLogs);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
