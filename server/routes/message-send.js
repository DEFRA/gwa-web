const boom = require('@hapi/boom')

const { messageStates } = require('../constants')
const addAuditEvent = require('../lib/messages/add-audit-event')
const costOfMessageSend = require('../lib/messages/cost-of-message-send')
const { updateMessage } = require('../lib/db')
const getMessageRows = require('../lib/view/get-message-rows')
const BaseModel = require('../lib/misc/model')
const getPhoneNumbersToSendTo = require('../lib/messages/phone-numbers-to-send-to')
const { messageOptions } = require('../lib/route/route-options')
const uploadContactList = require('../lib/data/upload-contact-list')
const verifyMessageRequest = require('../lib/route/verify-message-request')

class Model extends BaseModel {}

const routeId = 'message-send'
const path = `/${routeId}/{messageId}`

async function refreshUsers (request) {
  await request.server.methods.db.getUsers.cache.drop()
  return request.server.methods.db.getUsers()
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyMessageRequest(request, 'Sent messages can not be sent again.')
      if (error) { return error }

      const [users, notifyStatus] = await Promise.all([
        request.server.methods.db.getUsers(),
        request.server.methods.getNotifyStatusViewData()])

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

      return h.view(routeId, new Model({ message, messageRows, notifyStatus }))
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

      message.contactCount = phoneNumbersToSendTo.length
      message.cost = costOfMessageSend(message)
      message.state = messageStates.sent

      const uploadRes = await uploadContactList(message, phoneNumbersToSendTo)
      if (!uploadRes) {
        return boom.internal(`Problem uploading contact list for message ${message.id}.`)
      }

      const { user } = request.auth.credentials
      addAuditEvent(message, user)
      const res = await updateMessage(message)
      if (res.statusCode !== 200) {
        return boom.internal('Problem sending message.', res)
      }
      await request.server.methods.db.getSentMessages.cache.drop()

      return h.redirect('/messages')
    },
    options: messageOptions
  }
]
