const boom = require('@hapi/boom')
const Joi = require('joi')

const { messageStates } = require('../constants')
const { scopes } = require('../permissions')
const { getMessage } = require('../lib/db')
const getMessageRows = require('../lib/view/get-message-rows')
const BaseModel = require('../lib/misc/model')
const getReceiptData = require('../lib/data/get-receipt-data')

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

      const isMessageSent = message.state === messageStates.sent

      let sentStats = {}
      if (isMessageSent) {
        sentStats = await getReceiptData(messageId)
      }

      const messageRows = getMessageRows(message, sentStats)

      return h.view(routeId, new Model({ isEditable: !isMessageSent, messageId, messageRows }))
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
