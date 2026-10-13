const userService = require('../services/user.service');

class UserController {
  async getUsers(req, res, next) {
    try {
      const users = await userService.getUsers();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const newUser = await userService.createUser(
        req.body,
        req.user.id,
        req.user.email
      );
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const updated = await userService.updateUser(
        req.params.id,
        req.body,
        req.user.id,
        req.user.email
      );
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(
        req.params.id,
        req.user.id,
        req.user.email
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const result = await userService.getAuditLogs({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
