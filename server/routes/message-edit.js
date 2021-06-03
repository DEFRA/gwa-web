const boom = require('@hapi/boom')
const Joi = require('joi')

const addAuditEvent = require('../lib/add-audit-event')
const BaseModel = require('../lib/model')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/organisation-checkboxes')
const generateSendToAllOrgsRadios = require('../lib/send-to-all-radios')
const { getAreaToOfficeMap, getMessage, getOrganisationList, updateMessage } = require('../lib/db')
const { message: errorMessages } = require('../lib/error-messages')
const { message: { failAction } } = require('../lib/fail-actions')
const { message: { payload } } = require('../lib/validations')
const { textMessages: { maxMessageLength }, messageStates } = require('../constants')

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

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

      const areaToOfficeMap = await getAreaToOfficeMap()
      const organisationList = await getOrganisationList()

      if (!areaToOfficeMap || !organisationList) {
        return boom.internal('Reference data not found.')
      }

      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, message.officeCodes)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList, message.orgCodes)
      const allOfficeRadios = generateSendToAllOrgsRadios(message.allOffices)

      return h.view(routeId, new Model({ ...message, allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }))
    },
    options: {
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
      validate: {
        params: Joi.object().keys({
          messageId: Joi.string().guid().required()
        }),
        payload,
        failAction: async (request, h, err) => {
          return await failAction(request, h, err, routeId)
        }
      }
    }
  }
]
