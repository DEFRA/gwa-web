const boom = require('@hapi/boom')
const Joi = require('joi')

const { errorMessages, textMessages: { maxMessageLength }, messageStates } = require('../constants')
const { scopes } = require('../permissions')
const { getMessage, updateMessage } = require('../lib/db')
const addAuditEvent = require('../lib/messages/add-audit-event')
const BaseModel = require('../lib/misc/model')
const { message: { failAction } } = require('../lib/route/fail-actions')
const { message: { payload } } = require('../lib/route/validations')
const generateOfficeCheckboxes = require('../lib/view/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/view/organisation-checkboxes')
const sendToAllRadios = require('../lib/view/send-to-all-radios')

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
    return { error: boom.badRequest('Sent messages can not be edited.') }
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

      const [areaToOfficeMap, organisationList] = await Promise.all([
        request.server.methods.db.getAreaToOfficeMap(),
        request.server.methods.db.getOrganisationList()
      ])
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, message.officeCodes)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList, message.orgCodes)
      const allOfficeRadios = sendToAllRadios(message.allOffices)
      const allOrgRadios = sendToAllRadios(message.allOrgs)

      return h.view(routeId, new Model({ ...message, allOfficeRadios, allOrgRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }))
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
      const { allOffices, allOrgs, info, officeCodes, orgCodes, text } = request.payload

      message.allOffices = allOffices
      message.allOrgs = allOrgs
      message.info = info?.trim()
      message.officeCodes = [officeCodes ?? []].flat()
      message.orgCodes = [orgCodes].flat()
      message.state = messageStates.edited
      message.text = text?.trim()
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
