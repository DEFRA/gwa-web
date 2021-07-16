const { messageStates } = require('../constants')
const { scopes } = require('../permissions')
const BaseModel = require('../lib/model')
const { getMessages } = require('../lib/db')

class Model extends BaseModel {}

const routeId = 'messages'
const path = `/${routeId}`

async function getRecentMessages (state) {
  const messages = await getMessages(`SELECT TOP 10 * FROM c WHERE c.state = "${state}" ORDER BY c.lastUpdatedAt DESC`)

  return messages.map(message => {
    const lastEvent = message.auditEvents.sort((e1, e2) => e2.time - e1.time)[0]
    return [
      { text: new Date(message.lastUpdatedAt).toLocaleString() },
      { text: message.text.slice(0, 47) + (message.text.length > 47 ? ' ...' : '') },
      { html: `<a href="mailto:${lastEvent.user.id}">${lastEvent.user.id}</a>` },
      { html: `<a href='/message-view/${message.id}'>View</a>` }
    ]
  })
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
