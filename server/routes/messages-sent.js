const { scopes } = require('../permissions')
const BaseModel = require('../lib/model')

class Model extends BaseModel {}

const routeId = 'messages-sent'
const path = `/${routeId}`

function getRecentMessages (sentMessages) {
  return sentMessages
    .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)
    .map(message => {
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
      const sentMessages = await request.server.methods.db.getSentMessages()

      // console.log('**************************')
      // console.log(sentMessages)
      const recentlySent = getRecentMessages(sentMessages)

      // console.log(recentlySent)
      return h.view(routeId, new Model({ recentlySent }))
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } }
    }
  }
]
