const express = require('express');
const customerController = require('../controllers/customer.controller');
const { authenticate, authorize, ROLES } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listCustomersSchema,
  customerIdSchema,
  createCustomerSchema,
  updateCustomerSchema,
} = require('../validation/customer.validation');

const router = express.Router();

// All customer routes require authentication
router.use(authenticate);

// View customers (admin, manager, analyst)
router.get('/', validate(listCustomersSchema), customerController.getCustomers);
router.get('/:id', validate(customerIdSchema), customerController.getCustomerById);

// Create customer (admin, manager)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createCustomerSchema),
  customerController.createCustomer
);

// Update customer (admin, manager)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

// Delete customer (admin only, soft deactivates if sales exist)
router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(customerIdSchema),
  customerController.deleteCustomer
);

module.exports = router;
