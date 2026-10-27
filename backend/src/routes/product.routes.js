const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate, authorize, ROLES } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listProductsSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
} = require('../validation/product.validation');

const router = express.Router();

router.use(authenticate);

// View products
router.get('/', validate(listProductsSchema), productController.getProducts);
router.get('/:id/details', validate(productIdSchema), productController.getProductDetails);
router.get('/:id', validate(productIdSchema), productController.getProductById);

// Create product (admin, manager)
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(createProductSchema),
  productController.createProduct
);

// Update product (admin, manager)
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(updateProductSchema),
  productController.updateProduct
);

// Deactivate product (admin only)
router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(productIdSchema),
  productController.deleteProduct
);

module.exports = router;
