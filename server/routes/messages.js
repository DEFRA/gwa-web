const { messageStates } = require('../constants')
const { scopes } = require('../permissions')
const { getMessages } = require('../lib/db')
const { getMessageRows } = require('../lib/misc/helpers')
const BaseModel = require('../lib/misc/model')

class Model extends BaseModel {}

const routeId = 'messages'
const path = `/${routeId}`

async function getRecentMessages (state, request) {
  const numberOfMessages = 10

  let messages
  if (state === messageStates.sent) {
    messages = (await request.server.methods.db.getSentMessages()).slice(0, numberOfMessages)
  } else {
    messages = await getMessages(`SELECT TOP ${numberOfMessages} * FROM c WHERE c.state = "${state}" ORDER BY c.lastUpdatedAt DESC`)
  }

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
        getRecentMessages(messageStates.sent, request)
      ])

      return h.view(routeId, new Model({ recentlyCreated, recentlyEdited, recentlySent }))
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } }
    }
  }
]
