const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize, ROLES } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdSchema,
  resetRequestIdSchema,
  userActivitySchema,
  auditLogsQuerySchema,
} = require('../validation/user.validation');

const router = express.Router();

// User management is strictly restricted to Administrators
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/', validate(listUsersSchema), userController.getUsers);
router.get('/audit-logs', validate(auditLogsQuerySchema), userController.getAuditLogs);
router.get('/reset-requests', userController.getPasswordResetRequests);
router.post(
  '/reset-requests/:requestId/complete',
  validate(resetRequestIdSchema),
  userController.completePasswordResetRequest
);
router.patch(
  '/reset-requests/:requestId/dismiss',
  validate(resetRequestIdSchema),
  userController.dismissPasswordResetRequest
);
router.get('/:id/activity', validate(userActivitySchema), userController.getUserActivity);
router.get('/:id', validate(userIdSchema), userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', validate(updateUserStatusSchema), userController.updateUserStatus);
router.post('/:id/reset-password', validate(userIdSchema), userController.resetPassword);
router.delete('/:id', validate(userIdSchema), userController.deleteUser);

module.exports = router;
