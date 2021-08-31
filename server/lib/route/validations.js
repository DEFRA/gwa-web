const Joi = require('joi')
const { textMessages: { maxInfoLength, maxMessageLength } } = require('../../constants')

const officeCodesRule = Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/)))
const orgCodesRule = Joi.alternatives().try(Joi.string(), Joi.array().min(1).items(Joi.string()))

module.exports = {
  message: {
    payload: Joi.object().keys({
      allOffices: Joi.boolean().required(),
      officeCodes: Joi.alternatives().when('allOffices', {
        is: false,
        then: officeCodesRule.required(),
        otherwise: officeCodesRule
      }),
      orgCodes: orgCodesRule.required(),
      text: Joi.string().trim().max(maxMessageLength).required(),
      info: Joi.string().trim().max(maxInfoLength).allow('').empty('')
    })
  }
}
