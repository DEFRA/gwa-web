const boom = require('@hapi/boom')
const Joi = require('joi')

const addAuditEvent = require('../lib/add-audit-event')
const BaseModel = require('../lib/model')
const { getMessage, getUsers, updateMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const { messageStates, textMessages: { oneMessageCost } } = require('../constants')
const { scopes } = require('../permissions')
const uploadContactList = require('../lib/upload-contact-list')

class Model extends BaseModel {}

async function getPhoneNumbersToSendTo (message) {
  const users = await getUsers()
  const phoneNumbers = []
  users.forEach(user => {
    user.phoneNumbers?.forEach(pn => {
      if (message.officeCodes.some(oc => pn.subscribedTo?.includes(oc))) {
        phoneNumbers.push(pn.number)
      }
    })
  })
  return phoneNumbers
}

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

      // TODO: if there are no contacts to send the message to - do not allow it to be sent
      const phoneNumbersToSendTo = await getPhoneNumbersToSendTo(message)
      const contactCount = phoneNumbersToSendTo.length
      const cost = contactCount * oneMessageCost

      message.cost = cost
      message.contactCount = contactCount
      message.state = messageStates.edited
      const { user } = request.auth.credentials
      addAuditEvent(message, user)

      const res = await updateMessage(message)
      if (res.statusCode !== 200) {
        return boom.internal('Problem updating message.', res)
      }

      const messageRows = getMessageRows(message)

      return h.view(routeId, new Model({ contactCount, cost, message, messageRows }))
    },
    options
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const message = await verifyRequest(request)

      // TODO: if there are no contacts to send the message to - do not allow it to be sent
      const phoneNumbersToSendTo = await getPhoneNumbersToSendTo(message)
      const contactCount = phoneNumbersToSendTo.length
      const cost = contactCount * oneMessageCost

      message.cost = cost
      message.contacts = phoneNumbersToSendTo
      message.contactCount = contactCount
      message.state = messageStates.sent

      // TODO: Upload the message criteria to blob storage. If successful, continue else error
      // client.uploadData(message) - needs implementation
      // await uploadContactList(message)
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
