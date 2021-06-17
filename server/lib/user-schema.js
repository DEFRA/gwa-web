const Joi = require('joi')

module.exports = Joi.object({
  emailAddress: Joi.string().email().required(),
  givenName: Joi.string().required(),
  surname: Joi.string().required(),
  orgCode: Joi.string().required(),
  orgName: Joi.string().required(),
  officeCode: Joi.string().pattern(/^[A-Z]{3}:[a-zA-Z0-9-]+$/).required(),
  officeLocation: Joi.string().required(),
  phoneNumbers: Joi.array().items(Joi.string().pattern(/^\+447[1-9][0-9]{8}$/)).required()
})
