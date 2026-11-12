const userService = require('../services/user.service');

const getClientIp = (req) =>
  req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;

class UserController {
  async getUsers(req, res, next) {
    try {
      const result = await userService.getUsers(req.query);
      res.status(200).json({
        success: true,
        data: result.users,
        activeAdminCount: result.activeAdminCount,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(Number(req.params.id));
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
      const user = await userService.createUser(req.body, req.user, getClientIp(req));
      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(
        Number(req.params.id),
        req.body,
        req.user,
        getClientIp(req)
      );
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const user = await userService.updateUserStatus(
        Number(req.params.id),
        req.body.is_active,
        req.user,
        getClientIp(req)
      );
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await userService.resetPassword(
        Number(req.params.id),
        req.user,
        getClientIp(req)
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(
        Number(req.params.id),
        req.user,
        getClientIp(req)
      );
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserActivity(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await userService.getUserActivityLogs(
        Number(req.params.id),
        page,
        limit
      );
      res.status(200).json({
        success: true,
        user: result.user,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await userService.getAuditLogs(page, limit);
      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPasswordResetRequests(req, res, next) {
    try {
      const requests = await userService.getPasswordResetRequests();
      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (err) {
      next(err);
    }
  }

  async completePasswordResetRequest(req, res, next) {
    try {
      const result = await userService.completePasswordResetRequest(
        Number(req.params.requestId),
        req.user,
        getClientIp(req)
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async dismissPasswordResetRequest(req, res, next) {
    try {
      const result = await userService.dismissPasswordResetRequest(
        Number(req.params.requestId),
        req.user,
        getClientIp(req)
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
