const Joi = require('joi')
const { scopes } = require('../permissions')

module.exports = {
  messageOptions: {
    auth: { access: { scope: [`+${scopes.message.manage}`] } },
    validate: {
      params: Joi.object().keys({
        messageId: Joi.string().guid().required()
      })
    }
  }
}
