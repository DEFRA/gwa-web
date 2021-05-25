const Joi = require('joi')
const boom = require('@hapi/boom')

const BaseModel = require('../lib/model')
const { getAreaToOfficeMap, getUser, updateUser } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')

const errorMessages = {}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/edit-contact/{phoneNumberId}',
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

      areaToOfficeMap.forEach(area => {
        area.officeLocations.forEach(ol => {
          const officeCode = ol.officeCode
          // Disable office location for corporate numbers
          if (phoneNumber.type === 'corporate' && officeCode === user.officeCode) {
            ol.disabled = true
            ol.checked = true
          } else if (phoneNumber?.subscribedTo?.includes(officeCode)) {
            ol.checked = true
          }
          ol.text = ol.officeLocation
          ol.value = officeCode
        })
      })
      const isCorporate = phoneNumber.type === 'corporate'

      return h.view('edit-contact', new Model({ areas: areaToOfficeMap, isCorporate, phoneNumber, user }))
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
    path: '/edit-contact/{phoneNumberId}',
    handler: async (request, h) => {
      const { phoneNumberId } = request.params
      const { id: userId } = request.auth.credentials.user
      const { officeLocations = [] } = request.payload

      const user = await getUser(userId)

      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)
      if (phoneNumber.type === 'corporate') {
        officeLocations.push(user.officeLocation)
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

        //     return h.view('edit-contact', new Model({ contact, items }, errors)).takeover()
        //   }
      }
    }
  }
]
