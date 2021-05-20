const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const BaseModel = require('../lib/model')
const { deactivateMessage, getMessage } = require('../lib/db')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/message/{messageId}/confirm-deactivate',
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (!message.sent_at || !message.info_active) {
        return h.redirect(`/message/${message.id}`)
      }

      return h.view('confirm-deactivate', new Model({ message }))
    },
    options: {
      validate: {
        params: joi.object().keys({
          messageId: joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/message/{messageId}/confirm-deactivate',
    handler: async (request, h) => {
      const { messageId } = request.params
      const { credentials } = request.auth

      await deactivateMessage(credentials.user.id, messageId)

      return h.redirect('/messages')
    },
    options: {
      validate: {
        params: joi.object().keys({
          messageId: joi.number().integer().required()
        })
      }
    }
  }
]
