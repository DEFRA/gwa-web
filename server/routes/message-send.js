const Joi = require('joi')
const boom = require('@hapi/boom')

const addAuditEvent = require('../lib/add-audit-event')
const BaseModel = require('../lib/model')
const { getMessage, getUsers, updateMessage } = require('../lib/db')
const getMessageRows = require('../lib/get-message-rows')
const { messageStates, textMessages: { oneMessageCost } } = require('../constants')
const { scopes } = require('../permissions')

class Model extends BaseModel {}

function getPhoneNumbersToSendTo (users, message) {
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

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { messageId } = request.params
      const { user } = request.auth.credentials
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be sent again.')
      }

      const users = await getUsers()
      const phoneNumbersToSendTo = getPhoneNumbersToSendTo(users, message)
      const contactCount = phoneNumbersToSendTo.length
      const cost = contactCount * oneMessageCost

      // update message with approximate cost and contact count
      message.cost = cost
      message.contactCount = contactCount
      message.editedBy = user.id
      message.state = messageStates.edited
      addAuditEvent(message, user)
      const res = await updateMessage(message)
      console.log(res)
      // if (res.statusCode !== 201) {
      //   return boom.internal('Problem creating message.', res)
      // }

      const messageRows = getMessageRows(message)

      return h.view(routeId, new Model({ contactCount, cost, message, messageRows }))
    },
    options: {
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
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { messageId } = request.params
      const { user } = request.auth.credentials

      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be sent again.')
      }

      // TODO: Upload the message criteria to blob storage. If successful, continue else error
      // client.uploadData(message) - needs implementation

      message.editedBy = user.id
      message.state = messageStates.sent
      addAuditEvent(message, user)
      const res = await updateMessage(message)
      if (res.statusCode !== 200) {
        return boom.internal('Problem sending message.', res)
      }

      return h.redirect('/messages')
    },
    options: {
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
  }
]
