const Joi = require('joi')
const { messages: { sentMessagePageSize } } = require('../constants')
const { scopes } = require('../permissions')
const { getMessageRows } = require('../lib/helpers')
const BaseModel = require('../lib/model')

class Model extends BaseModel {}

const routeId = 'messages-sent'
const path = `/${routeId}/{page?}`

function generatePagination (page, numberOfResults) {
  const resultsFrom = 1 + (page - 1) * sentMessagePageSize
  const maxOnPage = page * sentMessagePageSize
  const resultsTo = numberOfResults <= maxOnPage ? numberOfResults : maxOnPage

  const previous = page > 1 ? `/messages-sent/${page - 1}` : ''
  const next = numberOfResults > maxOnPage ? `/messages-sent/${page + 1}` : ''

  return {
    shouldDisplay: previous || next,
    links: {
      previous,
      next
    },
    numberOfResults,
    resultsFrom,
    resultsTo
  }
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const sentMessages = await request.server.methods.db.getSentMessages()

      const { page } = request.params
      const numberOfResults = sentMessages.length

      const pagination = generatePagination(page, numberOfResults)

      const messagesSlice = sentMessages.slice(pagination.resultsFrom - 1, pagination.resultsFrom + sentMessagePageSize - 1)
      const messages = getMessageRows(messagesSlice)
      return h.view(routeId, new Model({ pagination, messages }))
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } },
      validate: {
        params: Joi.object().keys({
          page: Joi.number().default(1)
        })
      }
    }
  }
]
