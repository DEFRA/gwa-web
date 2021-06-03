const boom = require('@hapi/boom')
const Joi = require('joi')

const addAuditEvent = require('../lib/add-audit-event')
const BaseModel = require('../lib/model')
const { getAreaToOfficeMap, getMessage, getOrganisationList, updateMessage } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/organisation-checkboxes')
const generateSendToAllOrgsRadios = require('../lib/send-to-all-radios')
const { textMessages: { maxMessageLength }, messageStates } = require('../constants')

const errorMessages = {
  allOffices: 'Select whether to send the message to all office locations',
  officeCodes: 'Select at least one office location',
  orgCodes: 'Select at least one organisation',
  text: 'Enter the text message',
  info: 'Enter the additional information'
}

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

      const checked = message.officeCodes
      const orgCodes = message.orgCodes
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, checked)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList, orgCodes)
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
        payload: Joi.object().keys({
          allOffices: Joi.boolean().required(),
          officeCodes: Joi.alternatives().when('allOffices', {
            is: false,
            then: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/))).required(),
            otherwise: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/)))
          }),
          orgCodes: Joi.alternatives().try(Joi.string(), Joi.array().min(1).items(Joi.string())).required(),
          text: Joi.string().max(maxMessageLength).required(),
          info: Joi.string().max(2000).allow('').empty('')
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)

          const areaToOfficeMap = await getAreaToOfficeMap()
          const organisationList = await getOrganisationList()

          if (!areaToOfficeMap || !organisationList) {
            return boom.internal('Reference data not found.')
          }

          let { allOffices, officeCodes, orgCodes } = request.payload
          if (typeof (officeCodes) === 'string') {
            officeCodes = [officeCodes]
          }
          if (typeof (orgCodes) === 'string') {
            orgCodes = [orgCodes]
          }
          const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, officeCodes)
          const orgCheckboxes = generateOrganisationCheckboxes(organisationList, orgCodes)
          const allOfficeRadios = generateSendToAllOrgsRadios(allOffices)

          return h.view(routeId, new Model({ ...request.payload, allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }, errors)).takeover()
        }
      }
    }
  }
]
