const axios = require('axios');
const { AI_URL } = require('../../../config/env');

const getAiResponse = async ({ socket, message }) => {
  const startTime = Date.now();
  socket.userStats.totalQueries += 1;

  try {
    const response = await axios.post(`${AI_URL}/ai/query/`, {
      user_query: message,
    });

    const data = response.data;
    const responseTime = Date.now() - startTime;

    socket.userStats.totalResponseTime += responseTime;

    if (data && data.response) {
      return { message: data.response };
    } else {
      return {
        message: 'Sorry, I could not fetch the information you requested.',
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    socket.userStats.totalResponseTime += responseTime;

    return {
      message: 'Sorry, there was an error processing your request.',
    };
  }
};

module.exports = { getAiResponse };
