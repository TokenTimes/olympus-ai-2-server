const {
  BLOCK,
  SUSPEND,
  INACTIVE,
  ACTIVE,
} = require('../../constants/status.constant');

const DailyStat = require('../../models/daily.stats.model');
const LoginHistory = require('../../models/login.history.model');
const Room = require('../../models/room.model');
const ChatMessage = require('../../models/chat.message.model');
const ChatSetting = require('../../models/chat.setting.model');
const User = require('../../models/user.model');
const logger = require('log4js').getLogger('user.status.handler.js');

const setUserStatus = async ({ socket }, status) => {
  try {
    const user = socket.user;

    if (user && user.status !== BLOCK && user.status !== SUSPEND) {
      if (status == ACTIVE) {
        user.status = ACTIVE;
        await user.save();
      } else if (status === INACTIVE) {
        const sessionDuration = Date.now() - socket.userStats.sessionStartTime;
        const { date, totalResponseTime, totalQueries } = socket.userStats;
        const [savedUser, dailyStat, activeUsers] = await Promise.all([
          User.findById(user._id),
          DailyStat.findOne({ date }),
          LoginHistory.distinct('userId', {
            time: { $gte: new Date(date) },
          }),
        ]);
        if (savedUser.status !== BLOCK && savedUser.status !== SUSPEND) {
          user.status = INACTIVE;
          await user.save();
        }
        const previousSessionDuration = dailyStat?.totalSessionDuration || 0;
        const previousTotalResponseTime = dailyStat?.totalResponseTime || 0;
        const previousTotalQueries = dailyStat?.totalQueries || 0;
        const previousSessionCount = dailyStat?.sessionCount || 0;

        const updatedSessionDuration =
          previousSessionDuration + sessionDuration;
        const updatedTotalResponseTime =
          previousTotalResponseTime + totalResponseTime;
        const updatedTotalQueries = previousTotalQueries + totalQueries;

        const averageResponseTime = updatedTotalQueries
          ? updatedTotalResponseTime / updatedTotalQueries
          : 0;
        const averageSessionDuration =
          updatedSessionDuration / (previousSessionCount + 1);

        await DailyStat.findOneAndUpdate(
          { date },
          {
            averageResponseTime,
            averageSessionDuration,
            totalSessionDuration: updatedSessionDuration,
            totalResponseTime: updatedTotalResponseTime,
            totalQueries: updatedTotalQueries,
            activeUsers: activeUsers.length,
            $inc: { sessionCount: 1 },
          },
          { upsert: true, new: true }
        );
      }
    } else {
      logger.warn(
        `User ${user._id} has blocked or suspended status. Status update skipped.`
      );
    }
  } catch (error) {
    logger.error(
      `Error updating user ${socket.user._id} status: ${error.message}`
    );
  }
};

const clearChatHistory = async ({ socket }) => {
  const user = socket.user;
  const setting = await ChatSetting.findOne({ userId: user._id });
  if (setting.clearChatHistory) {
    const rooms = await Room.find({ userId: user._id });

    if (rooms.length > 0) {
      const deleteMessagesPromises = rooms.map((room) =>
        ChatMessage.deleteMany({ roomId: room._id })
      );

      await Promise.all(deleteMessagesPromises);
      await Room.deleteMany({ userId: user._id });
    }
  }
};

const initializeUserStats = async ({ socket }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  socket.userStats = {
    totalResponseTime: 0,
    totalQueries: 0,
    sessionStartTime: Date.now(),
    date: today,
  };
};

module.exports = { setUserStatus, initializeUserStats };
