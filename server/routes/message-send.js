const Joi = require('joi')
const boom = require('@hapi/boom')

const BaseModel = require('../lib/model')
const { getMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const { messageStates } = require('../constants')
const { scopes } = require('../permissions')

class Model extends BaseModel {}

const routeId = 'message-send'
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
        return boom.unauthorized('Sent messages can not be sent again.')
      }

      // TODO: calculate number of contacts
      const contactsCount = 100
      // TODO: calculate cost
      const cost = 13

      const messageRows = getMessageRows(message)

      return h.view(routeId, new Model({ contactsCount, cost, message, messageRows }))
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.message.approve}`]
        }
      },
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
      const { credentials } = request.auth

      const message = await sendMessage(credentials.user.id, messageId)

      // In the event the message id doesn't exist or it
      // is already approved, the call will return null
      if (!message) {
        return h.redirect('/messages')
      }

      // Note: No await so as to not delay the response
      if (message.text) {
        enqueueMessageJobs(message)
          .catch(err => {
            request.log(['error', 'job-error'], err)
          })
      }

      return h.redirect('/messages')
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.message.approve}`]
        }
      },
      validate: {
        params: Joi.object().keys({
          messageId: Joi.string().guid().required()
        })
      }
    }
  }
]
