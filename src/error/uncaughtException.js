const logger = require('log4js').getLogger('uncaughtException');

const catchUnhandledError = () => {
  process.on('uncaughtException', (exception) => {
    logger.info('we got an Uncaughted Exception');
    logger.error(exception);
  });

  process.on('unhandledRejection', (rejection) => {
    logger.info('we got an Unhandled Rejection');
    logger.error(rejection);
  });

  process.on('warning', (warning) => {
    logger.info(warning.stack);
  });
};

module.exports = { catchUnhandledError };
