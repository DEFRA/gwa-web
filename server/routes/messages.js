const { messageStates } = require('../constants')
const { scopes } = require('../permissions')
const { getMessages } = require('../lib/db')
const { getMessageRows } = require('../lib/helpers')
const BaseModel = require('../lib/model')

class Model extends BaseModel {}

const routeId = 'messages'
const path = `/${routeId}`

async function getRecentMessages (state) {
  const messages = await getMessages(`SELECT TOP 10 * FROM c WHERE c.state = "${state}" ORDER BY c.lastUpdatedAt DESC`)

  return getMessageRows(messages)
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const [recentlyCreated, recentlyEdited, recentlySent] = await Promise.all([
        getRecentMessages(messageStates.created),
        getRecentMessages(messageStates.edited),
        getRecentMessages(messageStates.sent)
      ])

      return h.view(routeId, new Model({ recentlyCreated, recentlyEdited, recentlySent }))
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } }
    }
  }
]
