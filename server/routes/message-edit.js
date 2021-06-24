const boom = require('@hapi/boom')
const Joi = require('joi')

const { textMessages: { maxMessageLength }, messageStates } = require('../constants')
const { scopes } = require('../permissions')
const addAuditEvent = require('../lib/add-audit-event')
const { getMessage, updateMessage } = require('../lib/db')
const { message: errorMessages } = require('../lib/error-messages')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/organisation-checkboxes')
const BaseModel = require('../lib/model')
const { message: { failAction } } = require('../lib/route-fail-actions')
const { message: { payload } } = require('../lib/route-validations')
const generateSendToAllOrgsRadios = require('../lib/send-to-all-radios')

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const auth = { access: { scope: [`+${scopes.message.manage}`] } }
const routeId = 'message-edit'
const path = `/${routeId}/{messageId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be edited.')
      }

      const [areaToOfficeMap, organisationList] = await Promise.all([
        request.server.methods.db.getAreaToOfficeMap(),
        request.server.methods.db.getOrganisationList()
      ])
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, message.officeCodes)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList, message.orgCodes)
      const allOfficeRadios = generateSendToAllOrgsRadios(message.allOffices)

      return h.view(routeId, new Model({ ...message, allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }))
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
      const { user } = request.auth.credentials
      const { allOffices, info, officeCodes, orgCodes, text } = request.payload

      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be edited.')
      }

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

      return h.redirect('/messages')
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
