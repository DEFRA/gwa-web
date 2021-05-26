const boom = require('@hapi/boom')
const Joi = require('joi')

const officeCheckboxes = require('../lib/office-checkboxes')
const { getAreaToOfficeMap } = require('../lib/db')
const BaseModel = require('../lib/model')
const { getMappedErrors } = require('../lib/errors')
const { maxMsgLength } = require('../constants').textMessages

const errorMessages = {
  groupId: 'Select a group',
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

      areaToOfficeMap.forEach(area => {
        area.officeLocations.forEach(ol => {
          ol.text = ol.officeLocation
          ol.value = ol.officeCode
        })
      })
      const items = officeCheckboxes(areaToOfficeMap)
      return h.view(routeId, new Model({ items, maxMsgLength }))
    }
  },
  {
    method: 'POST',
    path: `/${routeId}`,
    handler: async (request, h) => {
      // create the message item in the DB
      // redirect to some page = TBD
      const { credentials } = request.auth
      const {
        groupId,
        text,
        info
      } = request.payload

      // await insertMessage(credentials.user.id, groupId, text, info)

      return h.redirect('/messages')
    },
    options: {
      validate: {
        payload: Joi.object().keys({
          groupId: Joi.number().integer().required(),
          text: Joi.string().max(maxMsgLength).empty('').when('info', {
            is: Joi.exist(),
            otherwise: Joi.required()
          }),
          info: Joi.string().max(2000).allow('').empty('')
        })
        // failAction: async (request, h, err) => {
        //   const errors = getMappedErrors(err, errorMessages)
        //   const { groupId } = request.payload

        //   return h.view(routeId, new Model({
        //     ...request.payload,
        //     items,
        //     maxMsgLength
        //   }, errors)).takeover()
        // }
      }
    }
  }
]
