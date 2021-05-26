const Joi = require('joi')
const boom = require('@hapi/boom')

const BaseModel = require('../lib/model')
const { getMessage } = require('../lib/db')
const { messageStates } = require('../constants')

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

      // TODO: The rows with 'pending' below can all come from message.audit
      // which is an array of different events
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
      const isEditable = message.state !== messageStates.sent

      return h.view(routeId, new Model({ isEditable, messageId, rows }))
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
