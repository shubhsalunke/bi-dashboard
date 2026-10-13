const saleService = require('../services/sale.service');

class SaleController {
  async createSale(req, res, next) {
    try {
      const sale = await saleService.createSale(
        req.body,
        req.user.id,
        req.user.email
      );

      res.status(201).json({
        success: true,
        message: 'Sale created successfully',
        data: sale,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSales(req, res, next) {
    try {
      const result = await saleService.getSales(req.query);

      res.status(200).json({
        success: true,
        data: result.sales,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSaleById(req, res, next) {
    try {
      const sale = await saleService.getSaleById(req.params.id);

      res.status(200).json({
        success: true,
        data: sale,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SaleController();
