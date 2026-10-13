const customerService = require('../services/customer.service');

class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const result = await customerService.getCustomers(req.query);
      res.status(200).json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const newCustomer = await customerService.createCustomer(
        req.body,
        req.user.id,
        req.user.email
      );
      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: newCustomer,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const updated = await customerService.updateCustomer(
        req.params.id,
        req.body,
        req.user.id,
        req.user.email
      );
      res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const result = await customerService.deleteCustomer(
        req.params.id,
        req.user.id,
        req.user.email
      );
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CustomerController();
