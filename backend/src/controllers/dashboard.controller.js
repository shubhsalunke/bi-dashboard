const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const summary = await dashboardService.getDashboardSummary(req.query);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSalesReport(req, res, next) {
    try {
      const report = await dashboardService.getSalesReport(req.query);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerInsights(req, res, next) {
    try {
      const insights = await dashboardService.getCustomerInsights();
      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
