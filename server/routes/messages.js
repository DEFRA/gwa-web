const BaseModel = require('../lib/model')
const { getMessages } = require('../lib/db')
const { messageStates } = require('../constants')

class Model extends BaseModel {}

async function getRecentMessages (state) {
  const messages = await getMessages(`SELECT TOP 10 * FROM c WHERE c.state = "${state}" ORDER BY c._ts DESC`)

  return messages.map(message => {
    const date = new Date(message._ts * 1000)
    return [
      { text: date.toLocaleString() },
      { text: message.text.slice(0, 50) },
      { html: message.editedBy ? `<a href="mailto:${message.editedBy}">${message.editedBy}</a>` : '' },
      { html: `<a href='/message-view/${message.id}'>View</a>` }
    ]
  })
}

module.exports = [
  {
    method: 'GET',
    path: '/messages',
    handler: async (request, h) => {
      const recentlyCreated = await getRecentMessages(messageStates.created)
      const recentlyEdited = await getRecentMessages(messageStates.edited)
      const recentlySent = await getRecentMessages(messageStates.sent)

      return h.view('messages', new Model({ recentlyCreated, recentlyEdited, recentlySent }))
    }
  }
]
