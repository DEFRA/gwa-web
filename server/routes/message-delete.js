const boom = require('@hapi/boom')

const BaseModel = require('../lib/misc/model')
const { deleteMessage } = require('../lib/db')
const getMessageRows = require('../lib/view/get-message-rows')
const { messageOptions } = require('../lib/route/options')
const verifyMessageRequest = require('../lib/route/verify-message-request')

class Model extends BaseModel {}

const routeId = 'message-delete'
const path = `/${routeId}/{messageId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyMessageRequest(request, 'Sent messages can not be deleted.')
      if (error) { return error }

      const messageRows = getMessageRows(message)

      return h.view(routeId, new Model({ message, messageRows }))
    },
    options: messageOptions
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyMessageRequest(request, 'Sent messages can not be deleted.')
      if (error) { return error }

      const res = await deleteMessage(message.id)
      if (res.statusCode !== 204) {
        return boom.internal('Message has not been deleted.', res)
      }

      return h.redirect('/messages')
    },
    options: messageOptions
  }
]
