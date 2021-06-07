const boom = require('@hapi/boom')
const Joi = require('joi')

const addAuditEvent = require('../lib/add-audit-event')
const BaseModel = require('../lib/model')
const { getMessage, updateMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const getPhoneNumbersToSendTo = require('../lib/get-phone-numbers-to-send-to')
const { messageStates, textMessages: { oneMessageCost } } = require('../constants')
const { scopes } = require('../permissions')
const uploadContactList = require('../lib/upload-contact-list')

class Model extends BaseModel {}

const routeId = 'message-send'
const path = `/${routeId}/{messageId}`

async function verifyRequest (request) {
  const { messageId } = request.params
  const message = await getMessage(messageId)

  if (!message) {
    return boom.notFound()
  }

  if (message.state === messageStates.sent) {
    return boom.unauthorized('Sent messages can not be sent again.')
  }
  return message
}
const options = {
  auth: {
    access: {
      scope: [`+${scopes.message.approve}`]
    }
  },
  validate: {
    params: Joi.object().keys({
      messageId: Joi.string().guid().required()
    })
  }
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const message = await verifyRequest(request)
      const users = await request.server.methods.db.getUsers()

      const phoneNumbersToSendTo = getPhoneNumbersToSendTo(users, message)

      // TODO: calc the cost based on message.text.length
      message.cost = phoneNumbersToSendTo.length * oneMessageCost
      message.contactCount = phoneNumbersToSendTo.length
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
      const message = await verifyRequest(request)
      // Drop from cache to run a fresh query, getting the most uptodate info
      await request.server.methods.db.getUsers.cache.drop()
      const users = await request.server.methods.db.getUsers()

      const phoneNumbersToSendTo = getPhoneNumbersToSendTo(users, message)
      if (phoneNumbersToSendTo.length === 0) {
        return boom.badRequest('Sending to 0 contacts is not allowed.')
      }

      message.cost = phoneNumbersToSendTo.length * oneMessageCost
      message.contacts = phoneNumbersToSendTo
      message.contactCount = phoneNumbersToSendTo.length
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
