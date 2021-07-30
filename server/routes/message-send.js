const boom = require('@hapi/boom')

const { messageStates } = require('../constants')
const uploadContactList = require('../lib/data/upload-contact-list')
const { getUsers } = require('../lib/db')
const costOfMessageSend = require('../lib/messages/cost-of-message-send')
const getPhoneNumbersToSendTo = require('../lib/messages/phone-numbers-to-send-to')
const upsertMessage = require('../lib/messages/upsert-message')
const BaseModel = require('../lib/misc/model')
const getMessageRows = require('../lib/view/get-message-rows')
const { messageOptions } = require('../lib/route/options')
const verifyMessageRequest = require('../lib/route/verify-message-request')

class Model extends BaseModel {}

const routeId = 'message-send'
const path = `/${routeId}/{messageId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyMessageRequest(request, 'Sent messages can not be sent again.')
      if (error) { return error }

      const users = await getUsers()

      const phoneNumbersToSendTo = getPhoneNumbersToSendTo(users, message)

      message.contactCount = phoneNumbersToSendTo.length
      message.cost = costOfMessageSend(message)

      const messageRows = getMessageRows(message)

      return h.view(routeId, new Model({ message, messageRows }))
    },
    options: messageOptions
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyMessageRequest(request, 'Sent messages can not be sent again.')
      if (error) { return error }

      const users = await getUsers(request)

      const phoneNumbersToSendTo = getPhoneNumbersToSendTo(users, message)
      if (phoneNumbersToSendTo.length === 0) {
        return boom.badRequest('Sending to 0 contacts is not allowed.')
      }

      message.contactCount = phoneNumbersToSendTo.length
      message.cost = costOfMessageSend(message)
      message.state = messageStates.sent

      const uploadRes = await uploadContactList(message, phoneNumbersToSendTo)
      if (!uploadRes) {
        return boom.internal(`Problem uploading contact list for message ${message.id}.`)
      }

      const { user } = request.auth.credentials
      const res = await upsertMessage(message, user)
      if (res.statusCode !== 200) {
        return boom.internal('Problem sending message.', res)
      }
      await request.server.methods.db.getSentMessages.cache.drop()

      return h.redirect(`/message-view/${message.id}`)
    },
    options: messageOptions
  }
]
