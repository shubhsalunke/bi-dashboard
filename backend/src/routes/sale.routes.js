const express = require('express');
const saleController = require('../controllers/sale.controller');
const { authenticate, authorize, ROLES } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createSaleSchema,
  listSalesSchema,
  saleIdSchema,
} = require('../validation/sale.validation');

const router = express.Router();

router.use(authenticate);

// View sales
router.get('/', validate(listSalesSchema), saleController.getSales);
router.get('/:id', validate(saleIdSchema), saleController.getSaleById);

// Create sale (admin, manager only)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createSaleSchema),
  saleController.createSale
);

module.exports = router;
