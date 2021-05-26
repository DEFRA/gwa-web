const Joi = require('joi')
const boom = require('@hapi/boom')

const BaseModel = require('../lib/model')
const { deleteMessage, getMessage } = require('../lib/db')
const { messageStates } = require('../constants')

class Model extends BaseModel {}

const routeId = 'message-delete'
const path = `/${routeId}/{messageId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be deleted.')
      }

      const rows = [
        [{ text: 'To' }, { text: message.officeLocations.join(', ') }],
        [{ text: 'Text message' }, { text: message.text }],
        [{ text: 'Additional information' }, { text: message.info }],
        [{ text: 'Created at' }, { text: new Date(message.createdAt).toLocaleString() }],
        [{ text: 'Created by' }, { text: 'pending' }],
        [{ text: 'Last updated at' }, { text: 'pending' }],
        [{ text: 'Last updated by' }, { text: 'pending' }],
        [{ text: 'Sent at' }, { text: 'pending' }],
        [{ text: 'Sent by' }, { text: 'pending' }]
      ]

      return h.view(routeId, new Model({ message, rows }))
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
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be deleted.')
      }

      const res = await deleteMessage(messageId)
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
