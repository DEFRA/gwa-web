const boom = require('@hapi/boom')
const Joi = require('joi')
const { scopes } = require('../permissions')
const generatePagination = require('../lib/view/generate-pagination')
const { getMessageRows } = require('../lib/misc/helpers')
const BaseModel = require('../lib/misc/model')

class Model extends BaseModel {}

const routeId = 'messages-sent'
const path = `/${routeId}/{page?}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const sentMessages = await request.server.methods.db.getSentMessages()

      const { page } = request.params
      const numberOfResults = sentMessages.length

      const pagination = generatePagination(page, numberOfResults)
      if (page > 1 && page > pagination.numberOfPages) {
        return boom.notFound('No messages found')
      }

      const messagesSlice = sentMessages.slice(pagination.resultsFrom - 1, pagination.resultsFrom + pagination.pageSize - 1)
      const messages = getMessageRows(messagesSlice)
      return h.view(routeId, new Model({ pagination, messages }))
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } },
      validate: {
        params: Joi.object().keys({
          page: Joi.number().min(1).default(1)
        })
      }
    }
  }
]
