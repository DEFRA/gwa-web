const boom = require('@hapi/boom')
const Joi = require('joi')
const { v4: uuid } = require('uuid')

const addAuditEvent = require('../lib/add-audit-event')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/organisation-checkboxes')
const generateSendToAllOrgsRadios = require('../lib/send-to-all-radios')
const { getAreaToOfficeMap, getOrganisationList, saveMessage } = require('../lib/db')
const BaseModel = require('../lib/model')
const { getMappedErrors } = require('../lib/errors')
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

const routeId = 'message-create'
const path = `/${routeId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const areaToOfficeMap = await getAreaToOfficeMap()
      const organisationList = await getOrganisationList()

      if (!areaToOfficeMap || !organisationList) {
        return boom.internal('Reference data not found.')
      }

      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList)
      const allOfficeRadios = generateSendToAllOrgsRadios()

      return h.view(routeId, new Model({ allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }))
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { user } = request.auth.credentials
      const { allOffices, info, officeCodes, orgCodes, text } = request.payload

      const message = {
        allOffices,
        id: uuid(),
        info,
        officeCodes: [officeCodes ?? []].flat(),
        orgCodes: [orgCodes].flat(),
        text,
        state: messageStates.created
      }
      addAuditEvent(message, user)
      const res = await saveMessage(message)
      if (res.statusCode !== 201) {
        return boom.internal('Problem creating message.', res)
      }

      return h.redirect('/messages')
    },
    options: {
      validate: {
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

          return h.view(routeId, new Model({ allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes, ...request.payload }, errors)).takeover()
        }
      }
    }
  }
]
