const Joi = require('joi');

function validateChangeRoomName(object) {
  return Joi.object({
    roomId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .message('Invalid Room ID format'),
    roomName: Joi.string().required().messages({
      'string.empty': 'Room name is required',
      'string.base': 'Room name must be a string',
    }),
  }).validate(object);
}

function validateDeleteRoom(object) {
  return Joi.object({
    roomId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .message('Invalid Room ID format'),
  }).validate(object);
}

function validatePaginationParams(object) {
  return Joi.object({
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(5).required(),
  }).validate(object);
}
function validateGetAllMessage(object) {
  return Joi.object({
    roomId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .message('Invalid Room ID format'),
    page: Joi.number().min(1).required(),
    limit: Joi.number().min(10).required(),
  }).validate(object);
}

module.exports = {
  validateChangeRoomName,
  validateDeleteRoom,
  validatePaginationParams,
  validateGetAllMessage,
};
