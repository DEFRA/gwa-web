const joi = require('joi')
const boom = require('@hapi/boom')
const { scopes } = require('../permissions')
const BaseModel = require('../lib/model')
const { approveMessage, getMessage } = require('../lib/db')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/message/{messageId}/confirm-approve',
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.approved_at || message.sent_at) {
        return h.redirect(`/message/${message.id}`)
      }

      return h.view('confirm-approve', new Model({ message }))
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
    path: '/message/{messageId}/confirm-approve',
    handler: async (request, h) => {
      const { messageId } = request.params
      const { credentials } = request.auth

      // Note: In the event the message id doesn't exist or it
      // is already approved/sent, the call will
      // not update the db and return null
      await approveMessage(credentials.user.id, messageId)

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
