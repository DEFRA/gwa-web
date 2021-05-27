const boom = require('@hapi/boom')
const Joi = require('joi')

const addAuditEvent = require('../lib/add-audit-event')
const BaseModel = require('../lib/model')
const { getAreaToOfficeMap, getMessage, updateMessage } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')
const { textMessages: { maxMessageLength }, messageStates } = require('../constants')
const officeCheckboxes = require('../lib/office-checkboxes')

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

      if (!areaToOfficeMap) {
        return boom.internal('Office to location map not found.')
      }

      const checked = [...new Set(message.officeCodes.flat())]
      const items = officeCheckboxes(areaToOfficeMap, checked)

      return h.view(routeId, new Model({ ...message, maxMessageLength, items }))
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
      message.editedBy = user.id
      message.state = messageStates.edited
      addAuditEvent(message, user)
      const res = await updateMessage(message)
      console.log(res)

      return h.redirect(`/message-view/${messageId}`)
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

          const { officeCodes } = request.payload
          const areaToOfficeMap = await getAreaToOfficeMap()
          const items = officeCheckboxes(areaToOfficeMap, officeCodes)

          return h.view(routeId, new Model({ ...request.payload, items, maxMessageLength }, errors)).takeover()
        }
      }
    }
  }
]
