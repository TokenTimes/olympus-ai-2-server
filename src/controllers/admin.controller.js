const AdminService = require('../services/admin.service');
const { HttpException } = require('../error/HttpException');
const errorType = require('../error/errorCodes');
const {
  validateAdminLogin,
  validateAddRole,
  validateGrantRole,
  validateRevokeRole,
  validatePaginationParams,
  validateUpdateUserStatus,
  validateGetAllUsers,
  validateUpdateProjectDetail,
  validateDeleteUser,
  validateUpdateApiKey,
  validateGetGraphData,
} = require('../validators/admin.validator');

class AdminController {
  constructor() {
    this.adminService = new AdminService();
  }

  async login(req, res) {
    const { error } = validateAdminLogin(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.login(req.body);
    res.status(200).json({
      success: true,
      data: data.admin,
      message: data.message,
    });
  }

  async getAllUsers(req, res) {
    const { error } = validateGetAllUsers(req.query);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    let dbQuery = {};
    if (req.query.status != 'All') {
      dbQuery = {
        status: req.query.status,
      };
    }
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const data = await this.adminService.getAllUsers({ page, limit }, dbQuery);
    res.status(200).json({
      success: true,
      data: data.data,
      message: data.message,
    });
  }

  async getAllAdmins(req, res) {
    const { error } = validatePaginationParams(req.query);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const data = await this.adminService.getAllAdmins({ page, limit });
    res.status(200).json({
      success: true,
      data: data.data,
      message: data.message,
    });
  }

  async addRole(req, res) {
    const { error } = validateAddRole(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.addRole(req.body, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  }

  async grantRole(req, res) {
    const { error } = validateGrantRole(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.grantRole(req.body, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  }

  async revokeRole(req, res) {
    const { error } = validateRevokeRole(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.revokeRole(req.body, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  }

  async getDailyStat(req, res) {
    const data = await this.adminService.getDailyStat();
    res.status(200).json({
      success: true,
      message: data.message,
      data: data.data,
    });
  }

  async updateUserStatus(req, res) {
    const { error } = validateUpdateUserStatus(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.updateUserStatus(req.body, req.user);
    res.status(200).json({
      success: true,
      message: data.message,
      data: data.user,
    });
  }

  async deleteUser(req, res) {
    const { error } = validateDeleteUser(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.deleteUser(req.body, req.user);
    res.status(200).json({
      success: true,
      message: data.message,
      data: data.user,
    });
  }

  async getAllApiKey(req, res) {
    const data = await this.adminService.getAllApiKey();
    res.status(200).json({
      success: true,
      message: data.message,
      data: data.keys,
    });
  }

  async updateApiKey(req, res) {
    const { error } = validateUpdateApiKey(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.updateApiKey(req.body, req.user);
    res.status(200).json({
      success: true,
      data: data.key,
      message: data.message,
    });
  }

  async getProjectDetail(req, res) {
    const { error } = validatePaginationParams(req.query);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await this.adminService.getProjectDetail({ page, limit });
    res.status(200).json({
      success: true,
      data: data.data,
      message: data.message,
    });
  }

  async updateProjectDetail(req, res) {
    const { error } = validateUpdateProjectDetail(req.body);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.updateProjectDetail(
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      data: data.data,
      message: data.message,
    });
  }

  async getGraphData(req, res) {
    const { error } = validateGetGraphData(req.query);
    if (error) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        error.details[0].message
      );
    }
    const data = await this.adminService.getGraphData(
      req.query.time,
      req.query.type
    );
    res.status(200).json({
      success: true,
      data: data.graphData,
      message: data.message,
    });
  }
}

module.exports = AdminController;
