const boom = require('@hapi/boom')
const Joi = require('joi')

const BaseModel = require('../lib/model')
const { getAreaToOfficeMap, getUser, updateUser } = require('../lib/db')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const { phoneNumberTypes } = require('../constants')

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
      const userId = request.auth.credentials.user.id
      const areaToOfficeMap = await getAreaToOfficeMap()

      if (!areaToOfficeMap) {
        return boom.internal('Office to location map not found.')
      }

      const user = await getUser(userId)
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)

      if (!phoneNumber) {
        return boom.notFound('Phone number not found.')
      }

      const isCorporate = phoneNumber.type === phoneNumberTypes.corporate
      const checked = [...new Set(phoneNumber.subscribedTo.flat())]
      const disabled = isCorporate ? [user.officeCode] : []
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, checked, disabled)

      return h.view(routeId, new Model({ officeCheckboxes, isCorporate, phoneNumber, user }))
    },
    options: {
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
      const { id: userId } = request.auth.credentials.user
      const { officeCodes = [] } = request.payload

      const user = await getUser(userId)

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
