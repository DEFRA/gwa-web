const boom = require('@hapi/boom')
const Joi = require('joi')

const { phoneNumberTypes } = require('../constants')
const { updateUser } = require('../lib/db')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const BaseModel = require('../lib/model')
const { getUser } = require('../lib/route-pre-handlers')

const errorMessages = {}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const routeId = 'contact-edit'
const path = `/${routeId}/{phoneNumberId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { phoneNumberId } = request.params
      const user = request.pre.user
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)

      if (!phoneNumber) {
        return boom.notFound('Phone number not found.')
      }

      const isCorporate = phoneNumber.type === phoneNumberTypes.corporate
      const checked = [...new Set(phoneNumber.subscribedTo.flat())]
      const disabled = isCorporate ? [user.officeCode] : []
      const areaToOfficeMap = await request.server.methods.db.getAreaToOfficeMap()
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, checked, disabled)

      return h.view(routeId, new Model({ officeCheckboxes, isCorporate, phoneNumber, user }))
    },
    options: {
      pre: [getUser],
      validate: {
        params: Joi.object().keys({
          phoneNumberId: Joi.string().guid().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { phoneNumberId } = request.params
      const { officeCodes = [] } = request.payload
      const user = request.pre.user
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)
      if (phoneNumber.type === phoneNumberTypes.corporate) {
        officeCodes.push(user.officeCode)
      }
      phoneNumber.subscribedTo = officeCodes

      const response = await updateUser(user)
      if (response.statusCode !== 200) {
        boom.internal('Error updating user.', response)
      }

      return h.redirect('/account')
    },
    options: {
      pre: [getUser],
      validate: {
        params: Joi.object().keys({
          phoneNumberId: Joi.string().guid().required()
        }),
        payload: Joi.object().keys({
          officeCodes: Joi.array().items(Joi.string().required()).single().default([])
        })
      }
    }
  }
]
