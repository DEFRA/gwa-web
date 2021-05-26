const boom = require('@hapi/boom')
const Joi = require('joi')

const BaseModel = require('../lib/model')
const { getAreaToOfficeMap, getMessage, updateMessage } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')
const { textMessages: { maxMsgLength }, messageStates } = require('../constants')
const officeCheckboxes = require('../lib/office-checkboxes')

const errorMessages = {
  officeLocations: 'Select at least one office location',
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

      const checked = [...new Set(message.officeLocations.flat())]
      const items = officeCheckboxes(areaToOfficeMap, checked)

      return h.view(routeId, new Model({ ...message, maxMsgLength, items }))
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
      const { info, officeLocations, text } = request.payload

      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.state === messageStates.sent) {
        return boom.unauthorized('Sent messages can not be edited.')
      }

      message.text = text
      message.info = info
      message.officeLocations = [officeLocations].flat()
      message.editedBy = user.id
      message.state = messageStates.edited
      message.audit.push({
        event: messageStates.created,
        time: Date.now(),
        user: {
          id: user.id,
          surname: user.surname,
          givenName: user.givenName,
          companyName: user.companyName
        }
      })
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
          officeLocations: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/))).required(),
          text: Joi.string().max(maxMsgLength).required(),
          info: Joi.string().max(2000).allow('').empty('')
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)

          const { officeLocations } = request.payload
          const areaToOfficeMap = await getAreaToOfficeMap()
          const items = officeCheckboxes(areaToOfficeMap, officeLocations)

          return h.view(routeId, new Model({ ...request.payload, items, maxMsgLength }, errors)).takeover()
        }
      }
    }
  }
]
