const Joi = require('joi')
const { textMessages: { maxMessageLength } } = require('../constants')

module.exports = {
  message: {
    payload: Joi.object().keys({
      allOffices: Joi.boolean().required(),
      officeCodes: Joi.alternatives().when('allOffices', {
        is: false,
        then: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/))).required(),
        otherwise: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/)))
      }),
      orgCodes: Joi.alternatives().try(Joi.string(), Joi.array().min(1).items(Joi.string())).required(),
      text: Joi.string().max(maxMessageLength).required(),
      info: Joi.string().max(2000).allow('').empty('')
    })
  }
}
