const { Router } = require('express');
const AdminController = require('../controllers/admin.controller');
const { authToken } = require('../middlewares/auth.middleware');
const {
  isAdmin,
  isApiManager,
  isContentManager,
  isSuperAdmin,
} = require('../middlewares/user.type.middleware');

class AdminRoute {
  constructor() {
    this.path = '/api/admin/';
    this.router = Router();
    this.adminController = new AdminController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post(
      `${this.path}login`,
      this.adminController.login.bind(this.adminController)
    );

    this.router.get(
      `${this.path}getAllUsers`,
      authToken,
      isAdmin,
      this.adminController.getAllUsers.bind(this.adminController)
    );

    this.router.get(
      `${this.path}getAllAdmins`,
      authToken,
      isAdmin,
      this.adminController.getAllAdmins.bind(this.adminController)
    );

    this.router.post(
      `${this.path}addRole`,
      authToken,
      isSuperAdmin,
      this.adminController.addRole.bind(this.adminController)
    );

    this.router.post(
      `${this.path}grantRole`,
      authToken,
      isSuperAdmin,
      this.adminController.grantRole.bind(this.adminController)
    );

    this.router.post(
      `${this.path}revokeRole`,
      authToken,
      isSuperAdmin,
      this.adminController.revokeRole.bind(this.adminController)
    );

    this.router.get(
      `${this.path}getDailyStat`,
      authToken,
      isAdmin,
      this.adminController.getDailyStat.bind(this.adminController)
    );

    this.router.put(
      `${this.path}updateUserStatus`,
      authToken,
      isSuperAdmin,
      this.adminController.updateUserStatus.bind(this.adminController)
    );

    this.router.delete(
      `${this.path}deleteUser`,
      authToken,
      isSuperAdmin,
      this.adminController.deleteUser.bind(this.adminController)
    );

    this.router.get(
      `${this.path}getAllApiKey`,
      authToken,
      isAdmin,
      this.adminController.getAllApiKey.bind(this.adminController)
    );

    this.router.put(
      `${this.path}updateApiKey`,
      authToken,
      isApiManager,
      this.adminController.updateApiKey.bind(this.adminController)
    );

    this.router.get(
      `${this.path}getProjectDetail`,
      authToken,
      isAdmin,
      this.adminController.getProjectDetail.bind(this.adminController)
    );

    this.router.put(
      `${this.path}updateProjectDetail`,
      authToken,
      isContentManager,
      this.adminController.updateProjectDetail.bind(this.adminController)
    );

    this.router.get(
      `${this.path}getGraphData`,
      authToken,
      isAdmin,
      this.adminController.getGraphData.bind(this.adminController)
    );
  }
}

module.exports = AdminRoute;
