const BaseModel = require('../lib/model')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/info',
    handler: async (request, h) => {
      const infoActiveMessages = [{}]

      const infoActiveRows = infoActiveMessages
        .map(message => {
          return {
            group: `${message.group_name} (${message.group_code})`,
            info: message.info,
            created_by: `${date(message.created_at).fromNow()} by ${message.created_by}`,
            approved_by: `${date(message.approved_at).fromNow()} by ${message.approved_by}`,
            sent_by: `${date(message.sent_at).fromNow()}`
          }
        })

      return h.view('info', new Model({ infoActiveRows }))
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  }
]
