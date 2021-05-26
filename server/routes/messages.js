const { messageStates } = require('../constants')
const BaseModel = require('../lib/model')
const { getMessages } = require('../lib/db')

class Model extends BaseModel {}

async function getRecentMessageRows (type) {
  const config = {
    edited: {
      link: id => `<a href='/message-edit/${id}'>Edit</a>`,
      state: messageStates.created
    },
    sent: {
      link: id => `<a href='/message/${id}'>View</a>`,
      state: messageStates.sent
    }
  }
  const messages = await getMessages(`SELECT TOP 10 * FROM c WHERE c.state = "${config[type].state}" ORDER BY c._ts DESC`)

  return messages.map(message => {
    const date = new Date(message._ts * 1000)
    return [
      { text: date.toLocaleString() },
      { text: message.text.slice(0, 50) },
      { html: message.editedBy ? `<a href="mailto:${message.editedBy}">${message.editedBy}</a>` : '' },
      { html: config[type].link(message.id) }
    ]
  })
}

module.exports = [
  {
    method: 'GET',
    path: '/messages',
    handler: async (request, h) => {
      const recentlySentRows = await getRecentMessageRows('sent')
      const recentlyEditedRows = await getRecentMessageRows('edited')

      return h.view('messages', new Model({ recentlyEditedRows, recentlySentRows }))
    }
  }
]
