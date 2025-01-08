const User = require('../models/user.model');
const ChatSetting = require('../models/chat.setting.model');
const ApiKey = require('../models/api.key.model');
const DailyStat = require('../models/daily.stats.model');
const CryptoIdentity = require('../models/identity.model');
const ProjectDetails = require('../models/project.details.model');
const Room = require('../models/room.model');
const ChatMessage = require('../models/chat.message.model');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('../utils/encrypt.decrypt');
const { getDateAndGroupFormat } = require('../utils/graph.helper');
const { HttpException } = require('../error/HttpException');
const errorType = require('../error/errorCodes');
const {
  USER,
  ADMIN,
  API_MANAGER,
  CONTENT_MANAGER,
} = require('../constants/roles.constant');
const {
  BLOCK,
  SUSPEND,
  ACTIVE,
  INACTIVE,
} = require('../constants/status.constant');
const { SALT } = require('../../config/env');
const logger = require('log4js').getLogger('admin_service');

class AdminService {
  async login(loginDetails) {
    const admin = await User.findOne({
      email: loginDetails.email,
      userType: { $in: [ADMIN, API_MANAGER, CONTENT_MANAGER] },
    });

    if (!admin) {
      throw new HttpException(
        errorType.NOT_FOUND.status,
        'Admin Does not exist.'
      );
    }

    if (admin.totpFlag) {
      logger.info(`Login initiated by admin ${loginDetails.email} `);
      return {
        admin,
        message: '2FA enabled. Please validate using your TOTP.',
      };
    }

    const password = await bcrypt.compare(
      loginDetails.password,
      admin.password
    );
    if (!password) {
      throw new HttpException(
        errorType.UNAUTHORIZED.status,
        'Invalid Password'
      );
    }
    const token = await admin.generateAuthToken();
    logger.info(`Admin login successful for ${loginDetails.email}`);
    return { admin: { token, admin }, message: 'Enable 2fa ' };
  }

  async getAllUsers({ page, limit }, dbQuery) {
    const usersData = await User.aggregate([
      {
        $match: {
          userType: USER,
          ...dbQuery,
        },
      },
      {
        $sort: { name: 1 },
      },
      {
        $facet: {
          users: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: 'total' }],
        },
      },
    ]);

    const users = usersData[0].users;
    const total = usersData[0].totalCount[0]?.total || 0;

    const paginationInfo = {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRecords: total,
    };

    return {
      data: {
        users: users,
        pagination: paginationInfo,
      },
      message: 'All users fetched successfully',
    };
  }

  async getAllAdmins({ page, limit }) {
    const adminsData = await User.aggregate([
      {
        $match: {
          userType: { $in: [ADMIN, CONTENT_MANAGER, API_MANAGER] },
        },
      },
      {
        $sort: { name: 1 },
      },
      {
        $facet: {
          admins: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: 'total' }],
        },
      },
    ]);

    const admins = adminsData[0].admins;
    const total = adminsData[0].totalCount[0]?.total || 0;

    const paginationInfo = {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRecords: total,
    };

    return {
      data: {
        admins: admins,
        pagination: paginationInfo,
      },
      message: 'All admins fetched successfully',
    };
  }

  async addRole(roleDetails, admin) {
    let user = await User.findOne({ email: roleDetails.email });
    if (user) {
      throw new HttpException(
        errorType.CONFLICT.status,
        `User will email ${roleDetails.email} already exists.Please use grant role `
      );
    }

    const hashedPassword = await bcrypt.hash(
      roleDetails.password,
      Number(SALT)
    );

    user = await User.create({
      name: roleDetails.name,
      email: roleDetails.email,
      userType: [roleDetails.role],
      password: hashedPassword,
    });
    logger.info(
      `Admin ${admin.email} created new user: ${roleDetails.email} with role: ${roleDetails.role}`
    );
    return {
      user,
      message: `User ${roleDetails.email} created successfully with role: ${roleDetails.role}`,
    };
  }

  async grantRole(roleDetails, admin) {
    const user = await User.findOne({ email: roleDetails.email });
    if (!user) {
      throw new HttpException(
        errorType.NOT_FOUND.status,
        'User does not exist'
      );
    }

    if (user.userType.includes(ADMIN)) {
      throw new HttpException(
        errorType.BAD_REQUEST.status,
        `User ${roleDetails.email} already has the highest privileged role`
      );
    }

    if (user.userType.includes(roleDetails.role)) {
      throw new HttpException(
        errorType.CONFLICT.status,
        `User already has role ${roleDetails.role}`
      );
    }

    if (roleDetails.role === ADMIN) {
      user.userType = [ADMIN];
    } else {
      user.userType.push(roleDetails.role);
    }

    await user.save();
    logger.info(
      `Admin ${admin.email} granted role: ${roleDetails.role} to user: ${roleDetails.email}`
    );
    return {
      user,
      message: `Role ${roleDetails.role} granted to user ${roleDetails.email}`,
    };
  }

  async revokeRole(roleDetails, admin) {
    const user = await User.findOne({ email: roleDetails.email });
    if (!user) {
      throw new HttpException(
        errorType.NOT_FOUND.status,
        'User does not exist'
      );
    }
    if (
      user.userType.length === 0 ||
      (user.userType.length === 1 && user.userType.includes(USER))
    ) {
      throw new HttpException(
        errorType.NOT_FOUND.status,
        `User ${roleDetails.email} has no admin privileges`
      );
    }
    if (roleDetails.role === 'All') {
      user.userType = [USER];
      await user.save();
      logger.info(
        `Admin ${admin.email} revoked all roles for user: ${roleDetails.email}`
      );
      return {
        user,
        message: `All admin roles revoked for ${roleDetails.email}`,
      };
    }

    if (!user.userType.includes(roleDetails.role)) {
      throw new HttpException(
        errorType.CONFLICT.status,
        `User does not have role: ${roleDetails.role}`
      );
    }

    user.userType = user.userType.filter((role) => role !== roleDetails.role);
    if (user.userType.length === 0) {
      user.userType = [USER];
    }

    await user.save();
    logger.info(
      `Admin ${admin.email} revoked role: ${roleDetails.role} for user: ${roleDetails.email}`
    );
    return {
      user,
      message: `Role ${roleDetails.role} revoked for ${roleDetails.email}`,
    };
  }

  async getDailyStat() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyData = await DailyStat.findOne({ date: today });

    if (!dailyData) {
      return { message: 'No data available for today.', data: null };
    }

    return {
      message: 'Daily statistics fetched successfully.',
      data: dailyData,
    };
  }

  async updateUserStatus(userDetails, admin) {
    const user = await User.findOne({ email: userDetails.email });
    if (!user) {
      throw new HttpException(
        errorType.NOT_FOUND.status,
        'User does not exist'
      );
    }

    if (userDetails.status === user.status) {
      throw new HttpException(
        errorType.CONFLICT.status,
        `User is already ${user.status}`
      );
    }
    const oldStatus = user.status;

    if (userDetails.status === BLOCK) {
      user.status = BLOCK;
      await user.save();
      return {
        user,
        message: 'User blocked successfully',
      };
    }

    if (userDetails.status === SUSPEND) {
      user.status = SUSPEND;
      await user.save();
      return {
        user,
        message: 'User suspended successfully',
      };
    }

    const userStatus = user.status;
    user.status = INACTIVE;
    await user.save();
    logger.info(
      `Admin ${admin.email} updated status for user: ${userDetails.email} from ${oldStatus} to ${user.status}`
    );
    return {
      user,
      message: `User status changed from  ${userStatus} to ${INACTIVE} `,
    };
  }

  async deleteUser(userDetails, admin) {
    const user = await User.findOne({ email: userDetails.email });
    if (!user) {
      throw new HttpException(errorType.NOT_FOUND.status, 'User not found');
    }
    const rooms = await Room.find({ userId: user._id });

    if (rooms.length > 0) {
      const deleteMessagesPromises = rooms.map((room) =>
        ChatMessage.deleteMany({ roomId: room._id })
      );

      await Promise.all(deleteMessagesPromises);
      await Room.deleteMany({ userId: user._id });
    }
    await ChatSetting.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    logger.info(`Admin ${admin.email} deleted user: ${userDetails.email}`);
    return { message: 'User account deleted successfully' };
  }

  async getAllApiKey() {
    const keys = await ApiKey.find();
    if (!keys || keys.length === 0) {
      throw new HttpException(
        errorType.NOT_FOUND.status,
        'No API keys found in the database'
      );
    }
    const decryptedKeys = await Promise.all(
      keys.map(async (key) => ({
        ...key.toObject(),
        apiKey: await decrypt(key.apiKey),
      }))
    );

    return { keys: decryptedKeys, message: 'API keys retrieved successfully' };
  }

  async updateApiKey(apiDetails, admin) {
    const key = await ApiKey.findOne({
      _id: apiDetails._id,
    });

    if (!key) {
      throw new HttpException(
        errorType.NOT_FOUND.status,
        'API key not found for the specified platform'
      );
    }

    key.apiKey = await encrypt(apiDetails.apiKey);
    await key.save();
    logger.info(
      `Admin ${admin.email} updated API key for platform: ${key.platform}`
    );
    return {
      message: `API key for ${key.platform} updated successfully`,
    };
  }

  async getProjectDetail({ page, limit }) {
    const projectsData = await CryptoIdentity.aggregate([
      {
        $sort: { rank: 1 },
      },
      {
        $lookup: {
          from: 'projectdetails',
          localField: '_id',
          foreignField: 'projectId',
          as: 'projectDetail',
        },
      },
      {
        $facet: {
          projects: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: 'total' }],
        },
      },
    ]);

    const projects = projectsData[0]?.projects || [];
    const total = projectsData[0]?.totalCount[0]?.total || 0;

    const paginationInfo = {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRecords: total,
    };

    return {
      data: {
        projects,
        pagination: paginationInfo,
      },
      message: 'Project details fetched successfully',
    };
  }

  async updateProjectDetail(projectDetail, admin) {
    const projectData = await ProjectDetails.findOne({
      projectId: projectDetail.projectId,
    });

    if (!projectData) {
      throw new HttpException(errorType.NOT_FOUND.status, 'Project not found');
    }

    projectData.name = projectDetail.name;
    projectData.description = projectDetail.description;
    projectData.adminUpdates = true;

    await projectData.save();
    logger.info(
      `Admin ${admin.email} updated project details for projectId: ${projectDetail.projectId}`
    );
    return {
      data: {
        projectId: projectData.projectId,
        name: projectData.name,
        description: projectData.description,
        adminUpdates: projectData.adminUpdates,
      },
      message: 'Project details updated successfully',
    };
  }

  async getGraphData(filter, field) {
    const { startDate, groupFormat, now } = await getDateAndGroupFormat(filter);

    const data = await DailyStat.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: groupFormat,
          value: { $sum: `$${field}` },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const graphData = data.map((entry) => ({
      label: entry._id,
      value: entry.value,
    }));

    return {
      graphData,
      message: 'Graph data fetched successfully',
    };
  }
}
module.exports = AdminService;
