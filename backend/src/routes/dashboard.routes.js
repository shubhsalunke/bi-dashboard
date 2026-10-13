const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { dashboardFilterSchema } = require('../validation/report.validation');

const router = express.Router();

router.use(authenticate);

router.get('/summary', validate(dashboardFilterSchema), dashboardController.getSummary);

module.exports = router;
