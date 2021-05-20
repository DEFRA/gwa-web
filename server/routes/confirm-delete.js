const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const BaseModel = require('../lib/model')
const { deleteMessage, getMessage } = require('../lib/db')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/message/{messageId}/confirm-delete',
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.sent_at) {
        return h.redirect(`/message/${message.id}`)
      }

      return h.view('confirm-delete', new Model({ message }))
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
    path: '/message/{messageId}/confirm-delete',
    handler: async (request, h) => {
      const { messageId } = request.params

      await deleteMessage(messageId)

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
