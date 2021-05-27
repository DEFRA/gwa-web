const boom = require('@hapi/boom')
const Joi = require('joi')
const { v4: uuid } = require('uuid')

const addAuditEvent = require('../lib/add-audit-event')
const officeCheckboxes = require('../lib/office-checkboxes')
const { getAreaToOfficeMap, saveMessage } = require('../lib/db')
const BaseModel = require('../lib/model')
const { getMappedErrors } = require('../lib/errors')
const { textMessages: { maxMessageLength }, messageStates } = require('../constants')

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

const routeId = 'message-create'
const path = `/${routeId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const areaToOfficeMap = await getAreaToOfficeMap()

      if (!areaToOfficeMap) {
        return boom.internal('Office to location map not found.')
      }

      const items = officeCheckboxes(areaToOfficeMap)
      return h.view(routeId, new Model({ items, maxMessageLength }))
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { user } = request.auth.credentials
      const { info, officeCodes, text } = request.payload

      const message = {
        id: uuid(),
        info,
        officeCodes: [officeCodes].flat(),
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
          officeCodes: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/))).required(),
          text: Joi.string().max(maxMessageLength).required(),
          info: Joi.string().max(2000).allow('').empty('')
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)

          const { officeCodes } = request.payload
          const areaToOfficeMap = await getAreaToOfficeMap()
          const items = officeCheckboxes(areaToOfficeMap, officeCodes)

          return h.view(routeId, new Model({ ...request.payload, items, maxMessageLength }, errors)).takeover()
        }
      }
    }
  }
]
