const boom = require('@hapi/boom')
const Joi = require('joi')

const BaseModel = require('../lib/model')
const { deleteMessage, getMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const { messageStates } = require('../constants')

class Model extends BaseModel {}

const routeId = 'message-delete'
const path = `/${routeId}/{messageId}`

async function verifyRequest (request) {
  const { messageId } = request.params
  const message = await getMessage(messageId)

  if (!message) {
    return boom.notFound()
  }

  if (message.state === messageStates.sent) {
    return boom.unauthorized('Sent messages can not be deleted.')
  }

  return message
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const message = await verifyRequest(request)

      const messageRows = getMessageRows(message)

      return h.view(routeId, new Model({ message, messageRows }))
    },
    options: {
      validate: {
        params: Joi.object().keys({
          messageId: Joi.string().guid().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const message = await verifyRequest(request)

      const res = await deleteMessage(message.id)
      if (res.statusCode !== 204) {
        return boom.internal('Message has not been deleted.', res)
      }

      return h.redirect('/messages')
    },
    options: {
      validate: {
        params: Joi.object().keys({
          messageId: Joi.string().guid().required()
        })
      }
    }
  }
]
