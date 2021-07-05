const boom = require('@hapi/boom')
const Joi = require('joi')

const { messageStates } = require('../constants')
const { scopes } = require('../permissions')
const addAuditEvent = require('../lib/add-audit-event')
const costOfMessageSend = require('../lib/cost-of-message-send')
const { getMessage, updateMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const BaseModel = require('../lib/model')
const getPhoneNumbersToSendTo = require('../lib/phone-numbers-to-send-to')
const uploadContactList = require('../lib/upload-contact-list')

class Model extends BaseModel {}

const routeId = 'message-send'
const path = `/${routeId}/{messageId}`

const options = {
  auth: { access: { scope: [`+${scopes.message.manage}`] } },
  validate: {
    params: Joi.object().keys({
      messageId: Joi.string().guid().required()
    })
  }
}

async function verifyRequest (request) {
  const { messageId } = request.params
  const message = await getMessage(messageId)

  if (!message) {
    return { error: boom.notFound() }
  }

  if (message.state === messageStates.sent) {
    return { error: boom.unauthorized('Sent messages can not be sent again.') }
  }
  return { message }
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyRequest(request)
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
    options
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { error, message } = await verifyRequest(request)
      if (error) { return error }

      // Drop from cache to run a fresh query, getting the most up-to-date info
      await request.server.methods.db.getUsers.cache.drop()
      const users = await request.server.methods.db.getUsers()

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
    options
  }
]
