const date = require('../lib/date')
const BaseModel = require('../lib/model')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/messages',
    handler: async (request, h) => {
      const recentlySentRows = []
      // recentlySentMessages
      //   .map(message => {
      //     return [
      //       { text: `${message.group_name} (${message.group_code})` },
      //       { text: message.text },
      //       { text: message.info ? `${message.info_active ? '✔ ' : ''} ${message.info}` : '' },
      //       { text: `${date(message.sent_at).fromNow()} by ${message.sent_by}` },
      //       { html: `<a href='/message/${message.id}'>View</a>` }
      //     ]
      //   })

      return h.view('messages', new Model({
        recentlySentRows
      }))
    }
  }
]
