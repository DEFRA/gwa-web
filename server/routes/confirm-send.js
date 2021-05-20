const joi = require('joi')
const boom = require('@hapi/boom')
const { scopes } = require('../permissions')
const BaseModel = require('../lib/model')
const { sendMessage, getMessage, getGroupContactsCount, enqueueMessageJobs } = require('../lib/db')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/message/{messageId}/confirm-send',
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (!message.approved_at || message.sent_at) {
        return h.redirect(`/message/${message.id}`)
      }

      const contactsCount = message.text ? await getGroupContactsCount(message) : '0'

      return h.view('confirm-send', new Model({ message, hasText: !!message.text, contactsCount }))
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.message.approve}`]
        }
      },
      validate: {
        params: joi.object().keys({
          messageId: joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/message/{messageId}/confirm-send',
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
        params: joi.object().keys({
          messageId: joi.number().integer().required()
        })
      }
    }
  }
]
