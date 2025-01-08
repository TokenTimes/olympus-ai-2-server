const mongoose = require('mongoose');

const DailyStatSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  activeUsers: {
    type: Number,
    default: 0,
  },
  totalResponseTime: {
    type: Number,
    default: 0,
  },
  averageResponseTime: {
    type: Number,
    default: 0,
  },
  totalQueries: {
    type: Number,
    default: 0,
  },
  totalSessionDuration: {
    type: Number,
    default: 0,
  },
  sessionCount: {
    type: Number,
    default: 0,
  },
  averageSessionDuration: {
    type: Number,
    default: 0,
  },
});

const DailyStat = mongoose.model('DailyStat', DailyStatSchema);
module.exports = DailyStat;
