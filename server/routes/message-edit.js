const boom = require('@hapi/boom')
const Joi = require('joi')

const { errorMessages, textMessages: { maxMessageLength }, messageStates } = require('../constants')
const { scopes } = require('../permissions')
const addAuditEvent = require('../lib/messages/add-audit-event')
const { getMessage, updateMessage } = require('../lib/db')
const generateOfficeCheckboxes = require('../lib/view/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/view/organisation-checkboxes')
const BaseModel = require('../lib/misc/model')
const { message: { failAction } } = require('../lib/route/route-fail-actions')
const { message: { payload } } = require('../lib/route/route-validations')
const generateSendToAllOrgsRadios = require('../lib/view/send-to-all-radios')

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const auth = { access: { scope: [`+${scopes.message.manage}`] } }
const routeId = 'message-edit'
const path = `/${routeId}/{messageId}`

async function verifyRequest (messageId) {
  const message = await getMessage(messageId)

  if (!message) {
    return { error: boom.notFound() }
  }

  if (message.state === messageStates.sent) {
    return { error: boom.unauthorized('Sent messages can not be edited.') }
  }
  return { message }
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { messageId } = request.params
      const { error, message } = await verifyRequest(messageId)
      if (error) { return error }

      const [areaToOfficeMap, organisationList, notifyStatus] = await Promise.all([
        request.server.methods.db.getAreaToOfficeMap(),
        request.server.methods.db.getOrganisationList(),
        request.server.methods.getNotifyStatusViewData()
      ])
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, message.officeCodes)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList, message.orgCodes)
      const allOfficeRadios = generateSendToAllOrgsRadios(message.allOffices)

      return h.view(routeId, new Model({ ...message, allOfficeRadios, maxMessageLength, notifyStatus, officeCheckboxes, orgCheckboxes }))
    },
    options: {
      auth,
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
      const { error, message } = await verifyRequest(messageId)
      if (error) { return error }

      const { user } = request.auth.credentials
      const { allOffices, info, officeCodes, orgCodes, text } = request.payload

      message.allOffices = allOffices
      message.info = info
      message.officeCodes = [officeCodes ?? []].flat()
      message.orgCodes = [orgCodes].flat()
      message.state = messageStates.edited
      message.text = text
      addAuditEvent(message, user)

      const res = await updateMessage(message)
      if (res.statusCode !== 200) {
        return boom.internal('Problem updating message.', res)
      }

      return h.redirect(`/message-view/${messageId}`)
    },
    options: {
      auth,
      validate: {
        params: Joi.object().keys({
          messageId: Joi.string().guid().required()
        }),
        payload,
        failAction: async (request, h, err) => {
          return failAction(request, h, err, routeId)
        }
      }
    }
  }
]
