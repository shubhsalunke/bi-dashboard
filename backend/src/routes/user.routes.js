const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize, ROLES } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} = require('../validation/user.validation');

const router = express.Router();

// User management is strictly restricted to Administrators
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/', userController.getUsers);
router.get('/audit-logs', userController.getAuditLogs);
router.get('/:id', validate(userIdSchema), userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', validate(userIdSchema), userController.deleteUser);

module.exports = router;
