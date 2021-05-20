const date = require('../lib/date')
const BaseModel = require('../lib/model')
const { getAllMessagesReadyForApproval, getAllMessagesReadyForSending, getAllMessagesRecentlySent } = require('../lib/db')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/messages',
    handler: async (request, h) => {
      const readyForApprovalMessages = await getAllMessagesReadyForApproval()
      const readyForSendingMessages = await getAllMessagesReadyForSending()
      const recentlySentMessages = await getAllMessagesRecentlySent()

      const readyForApprovalRows = readyForApprovalMessages
        .map(message => {
          return [
            { text: `${message.group_name} (${message.group_code})` },
            { text: message.text },
            { text: message.info },
            { text: `${date(message.created_at).fromNow()} by ${message.created_by}` },
            { html: `<a href='/message/${message.id}'>View</a>` }
          ]
        })

      const readyForSendingRows = readyForSendingMessages
        .map(message => {
          return [
            { text: `${message.group_name} (${message.group_code})` },
            { text: message.text },
            { text: message.info },
            { text: `${date(message.approved_at).fromNow()} by ${message.approved_by}` },
            { html: `<a href='/message/${message.id}'>View</a>` }
          ]
        })

      const recentlySentRows = recentlySentMessages
        .map(message => {
          return [
            { text: `${message.group_name} (${message.group_code})` },
            { text: message.text },
            { text: message.info ? `${message.info_active ? '✔ ' : ''} ${message.info}` : '' },
            { text: `${date(message.sent_at).fromNow()} by ${message.sent_by}` },
            { html: `<a href='/message/${message.id}'>View</a>` }
          ]
        })

      return h.view('messages', new Model({
        readyForApprovalRows,
        readyForSendingRows,
        recentlySentRows
      }))
    }
  }
]
