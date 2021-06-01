const boom = require('@hapi/boom')
const Joi = require('joi')

const addAuditEvent = require('../lib/add-audit-event')
const BaseModel = require('../lib/model')
const { getAreaToOfficeMap, getMessage, getOrganisationList, updateMessage } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')
const { textMessages: { maxMessageLength }, messageStates } = require('../constants')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/organisation-checkboxes')

const errorMessages = {
  officeCodes: 'Select at least one office location',
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

      const checked = [...new Set(message.officeCodes.flat())]
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, checked)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList)

      return h.view(routeId, new Model({ ...message, maxMessageLength, officeCheckboxes, orgCheckboxes }))
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
      const { info, officeCodes, text } = request.payload

      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be edited.')
      }

      message.text = text
      message.info = info
      message.officeCodes = [officeCodes].flat()
      message.state = messageStates.edited
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
          officeCodes: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/))).required(),
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

          const { officeCodes } = request.payload
          const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, officeCodes)
          const orgCheckboxes = generateOrganisationCheckboxes(organisationList)

          return h.view(routeId, new Model({ ...request.payload, maxMessageLength, officeCheckboxes, orgCheckboxes }, errors)).takeover()
        }
      }
    }
  }
]
