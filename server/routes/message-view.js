const boom = require('@hapi/boom')
const Joi = require('joi')

const { messageStates } = require('../constants')
const { scopes } = require('../permissions')
const { getMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const BaseModel = require('../lib/model')

class Model extends BaseModel {}

const routeId = 'message-view'

module.exports = [
  {
    method: 'GET',
    path: `/${routeId}/{messageId}`,
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      const messageRows = getMessageRows(message)
      const notifyStatus = await request.server.methods.getNotifyStatusViewData()
      const isEditable = message.state !== messageStates.sent

      return h.view(routeId, new Model({ isEditable, messageId, messageRows, notifyStatus }))
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } },
      validate: {
        params: Joi.object().keys({
          messageId: Joi.string().guid().required()
        })
      }
    }
  }
]
