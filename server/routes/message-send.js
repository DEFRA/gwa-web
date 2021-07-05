const boom = require('@hapi/boom')

const { messageStates } = require('../constants')
const addAuditEvent = require('../lib/add-audit-event')
const costOfMessageSend = require('../lib/cost-of-message-send')
const { updateMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const BaseModel = require('../lib/model')
const getPhoneNumbersToSendTo = require('../lib/phone-numbers-to-send-to')
const { messageOptions } = require('../lib/route-options')
const uploadContactList = require('../lib/upload-contact-list')
const verifyMessageRequest = require('../lib/verify-message-request')

class Model extends BaseModel {}

const routeId = 'message-send'
const path = `/${routeId}/{messageId}`

async function refreshUsers (request) {
  await request.server.methods.db.getUsers.cache.drop()
  return await request.server.methods.db.getUsers()
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyMessageRequest(request, 'Sent messages can not be sent again.')
      if (error) { return error }

      const users = await request.server.methods.db.getUsers()

      const phoneNumbersToSendTo = getPhoneNumbersToSendTo(users, message)

      message.contactCount = phoneNumbersToSendTo.length
      message.cost = costOfMessageSend(message)
      message.state = messageStates.edited
      const { user } = request.auth.credentials
      addAuditEvent(message, user)
      const res = await updateMessage(message)
      if (res.statusCode !== 200) {
        return boom.internal('Problem updating message.', res)
      }

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

      const users = await refreshUsers(request)

      const phoneNumbersToSendTo = getPhoneNumbersToSendTo(users, message)
      if (phoneNumbersToSendTo.length === 0) {
        return boom.badRequest('Sending to 0 contacts is not allowed.')
      }

      message.contacts = phoneNumbersToSendTo
      message.contactCount = phoneNumbersToSendTo.length
      message.cost = costOfMessageSend(message)
      message.state = messageStates.sent

      const uploadRes = await uploadContactList(message)
      if (!uploadRes) {
        return boom.internal(`Problem uploading contact list for message ${message.id}.`)
      }

      const { user } = request.auth.credentials
      addAuditEvent(message, user)
      const res = await updateMessage(message)
      if (res.statusCode !== 200) {
        return boom.internal('Problem sending message.', res)
      }

      return h.redirect('/messages')
    },
    options: messageOptions
  }
]
