const boom = require('@hapi/boom')
const Joi = require('joi')
const { v4: uuid } = require('uuid')

const officeCheckboxes = require('../lib/office-checkboxes')
const { getAreaToOfficeMap, saveMessage } = require('../lib/db')
const BaseModel = require('../lib/model')
const { getMappedErrors } = require('../lib/errors')
const { textMessages: { maxMsgLength }, messageStates } = require('../constants')

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

const routeId = 'message-create'

module.exports = [
  {
    method: 'GET',
    path: `/${routeId}`,
    handler: async (request, h) => {
      const areaToOfficeMap = await getAreaToOfficeMap()

      if (!areaToOfficeMap) {
        return boom.internal('Office to location map not found.')
      }

      const items = officeCheckboxes(areaToOfficeMap)
      return h.view(routeId, new Model({ items, maxMsgLength }))
    }
  },
  {
    method: 'POST',
    path: `/${routeId}`,
    handler: async (request, h) => {
      const { user } = request.auth.credentials
      const { info, officeLocations, text } = request.payload
      const createdAt = Date.now()

      const msg = {
        id: uuid(),
        info,
        officeLocations: [officeLocations].flat(),
        text,
        createdAt,
        editedBy: user.id,
        state: messageStates.created,
        audit: [{
          event: messageStates.created,
          time: createdAt,
          user: {
            id: user.id,
            surname: user.surname,
            givenName: user.givenName,
            companyName: user.companyName
          }
        }]
      }
      const res = await saveMessage(msg)
      if (res.statusCode !== 201) {
        return boom.internal('Problem creating message.', res)
      }

      return h.redirect('/messages')
    },
    options: {
      validate: {
        payload: Joi.object().keys({
          officeLocations: Joi.alternatives().try(Joi.string().pattern(/^[A-Z]{3}:/), Joi.array().min(1).items(Joi.string().pattern(/^[A-Z]{3}:/))).required(),
          text: Joi.string().max(maxMsgLength).required(),
          info: Joi.string().max(2000).allow('').empty('')
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)

          const { officeLocations } = request.payload
          console.log(request.payload)

          const areaToOfficeMap = await getAreaToOfficeMap()
          const items = officeCheckboxes(areaToOfficeMap, officeLocations)
          return h.view(routeId, new Model({
            ...request.payload,
            items,
            maxMsgLength
          }, errors)).takeover()
        }
      }
    }
  }
]
