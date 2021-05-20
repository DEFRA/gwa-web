const joi = require('joi')
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
      const user = await getUser(userId)
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)
      areaToOfficeMap.areas.forEach(area => {
        area.officeLocations.forEach(ol => {
          const officeCode = ol.officeCode
          // Disable office location for corporate numbers
          if (phoneNumber.type === 'corporate' && officeCode === user.officeLocation) {
            ol.disabled = true
            ol.checked = true
          } else if (phoneNumber?.subscribedTo?.includes(officeCode)) {
            ol.checked = true
          }
          ol.text = ol.officeName
          ol.value = officeCode
        })
      })
      const isCorporate = phoneNumber.type === 'corporate'

      return h.view('edit-contact', new Model({ areas: areaToOfficeMap.areas, isCorporate, phoneNumber, user }))
    },
    options: {
      validate: {
        params: joi.object().keys({
          phoneNumberId: joi.string().guid().required()
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

      const updated = await updateUser(user)

      return h.redirect('/account')
    },
    options: {
      validate: {
        params: joi.object().keys({
          phoneNumberId: joi.string().guid().required()
        }),
        payload: joi.object().keys({
          officeLocations: joi.array().items(joi.string().required()).single().default([])
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
