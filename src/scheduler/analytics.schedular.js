const LoginHistory = require('../models/login.history.model');
const DailyStat = require('../models/daily.stats.model');
const logger = require('log4js').getLogger('analytics.schedular.js');
const updateDailyStat = async () => {
  try {
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);
    const previousDay = new Date(currentDate);
    previousDay.setDate(currentDate.getDate() - 1);

    const [dailyStat, activeUsers] = await Promise.all([
      DailyStat.findOne({ date: previousDay }),
      LoginHistory.distinct('userId', {
        time: { $gte: previousDay, $lt: currentDate },
      }),
    ]);

    if (dailyStat) {
      const {
        totalSessionDuration,
        totalResponseTime,
        totalQueries,
        sessionCount,
      } = dailyStat;

      const averageResponseTime = totalQueries
        ? totalResponseTime / totalQueries
        : 0;
      const averageSessionDuration = sessionCount
        ? totalSessionDuration / sessionCount
        : 0;

      await DailyStat.findOneAndUpdate(
        { date: previousDay },
        {
          averageResponseTime,
          averageSessionDuration,
          totalSessionDuration,
          totalResponseTime,
          totalQueries,
          activeUsers: activeUsers.length,
          sessionCount,
        },
        { upsert: true, new: true }
      );

      logger.log("Previous day's statistics updated successfully.");
    }
    const currentDailyStat = await DailyStat.findOne({ date: currentDate });
    if (!currentDailyStat) {
      await DailyStat.create({
        date: currentDate,
        totalSessionDuration: 0,
        totalResponseTime: 0,
        totalQueries: 0,
        activeUsers: 0,
        sessionCount: 0,
        averageResponseTime: 0,
        averageSessionDuration: 0,
      });

      logger.log('Current day statistics document created successfully.');
    }
  } catch (error) {
    logger.error('Error updating daily statistics:', error.message);
  }
};

module.exports = { updateDailyStat };
