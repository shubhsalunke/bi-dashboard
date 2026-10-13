const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { salesReportFilterSchema } = require('../validation/report.validation');

const router = express.Router();

router.use(authenticate);

router.get('/sales', validate(salesReportFilterSchema), dashboardController.getSalesReport);
router.get('/customer-insights', dashboardController.getCustomerInsights);

module.exports = router;
