const joi = require('joi')
const boom = require('@hapi/boom')
const date = require('../lib/date')
const BaseModel = require('../lib/model')
const { getMessage } = require('../lib/db')

const errorMessages = {
  group: {
    '*': 'Select a group'
  },
  text: {
    '*': {
      summary: 'Enter the text for the message',
      text: 'Enter the text for the message'
    }
  }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/message/{messageId}',
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      const created = date(message.created_at)
      const updated = date(message.updated_at)
      const approved = message.approved_at && date(message.approved_at)
      const sent = message.sent_at && date(message.sent_at)

      const rows = [
        [{ text: 'To' }, { text: `${message.group_name} (${message.group_code})` }],
        [{ text: 'Text message' }, { text: message.text }],
        [{ text: 'Additional information' }, { text: message.info }],
        [{ text: 'Created at' }, { text: `${created.format('HH:mma dddd D MMMM YYYY')} (${created.fromNow()})` }],
        [{ text: 'Created by' }, { text: message.created_by }],
        [{ text: 'Updated at' }, { text: `${updated.format('HH:mma dddd D MMMM YYYY')} (${updated.fromNow()})` }],
        [{ text: 'Updated by' }, { text: message.updated_by }],
        [{ text: 'Approved at' }, { text: approved ? `${approved.format('HH:mma dddd D MMMM YYYY')} (${approved.fromNow()})` : '' }],
        [{ text: 'Approved by' }, { text: message.approved_by }],
        [{ text: 'Sent at' }, { text: sent ? `${sent.format('HH:mma dddd D MMMM YYYY')} (${sent.fromNow()})` : '' }],
        [{ text: 'Sent by' }, { text: message.sent_by }]
      ]

      return h.view('message', new Model({ message, rows }))
    },
    options: {
      validate: {
        params: joi.object().keys({
          messageId: joi.number().integer().required()
        })
      }
    }
  }
]
