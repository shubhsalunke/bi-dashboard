const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { salesReportFilterSchema } = require('../validation/report.validation');

const router = express.Router();

router.use(authenticate);

router.get('/sales', validate(salesReportFilterSchema), dashboardController.getSalesReport);
router.get('/customer-insights', validate(salesReportFilterSchema), dashboardController.getCustomerInsights);
router.get('/brand-sales', validate(salesReportFilterSchema), dashboardController.getBrandSalesReport);

module.exports = router;
