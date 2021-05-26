const boom = require('@hapi/boom')
const Joi = require('joi')

const officeCheckboxes = require('../lib/office-checkboxes')
const BaseModel = require('../lib/model')
const { getAreaToOfficeMap, getUser, updateUser } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')

const errorMessages = {}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}
const routeId = 'contact-edit'

module.exports = [
  {
    method: 'GET',
    path: `/${routeId}/{phoneNumberId}`,
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

      const isCorporate = phoneNumber.type === 'corporate'
      const checked = [...new Set(phoneNumber.subscribedTo.flat())]
      const disabled = isCorporate ? [user.officeCode] : []
      const items = officeCheckboxes(areaToOfficeMap, checked, disabled)

      return h.view(routeId, new Model({ items, isCorporate, phoneNumber, user }))
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
    path: `/${routeId}/{phoneNumberId}`,
    handler: async (request, h) => {
      const { phoneNumberId } = request.params
      const { id: userId } = request.auth.credentials.user
      const { officeLocations = [] } = request.payload

      const user = await getUser(userId)

      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)
      if (phoneNumber.type === 'corporate') {
        officeLocations.push(user.officeCode)
      }
      phoneNumber.subscribedTo = officeLocations

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
          officeLocations: Joi.array().items(Joi.string().required()).single().default([])
        })
        //   failAction: async (request, h, err) => {
        //     const { phoneNumberId } = request.params
        //     const { credentials } = request.auth
        //     const userId = credentials.user.id
        //     // const contact = await getContact(userId, contactId)
        //     // const items = await getCheckboxItems(userId, contactId)
        //     const errors = getMappedErrors(err, errorMessages)

        //     return h.view(routeId, new Model({ contact, items }, errors)).takeover()
        //   }
      }
    }
  }
]
