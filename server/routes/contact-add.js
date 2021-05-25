const boom = require('@hapi/boom')
const Joi = require('joi')
const { v4: uuid } = require('uuid')

const BaseModel = require('../lib/model')
const { getUser, updateUser } = require('../lib/db')
const { parsePhoneNumber, types } = require('../lib/phone-number')
const { getMappedErrors } = require('../lib/errors')

const maxPersonalPhoneNumbers = 2
const errorMessages = {
  mobile: {
    tooMany: {
      summary: `The maximum number (${maxPersonalPhoneNumbers}) of personal phone numbers is already taken`,
      text: 'Maximum personal phone numbers already registered'
    },
    unique: {
      summary: 'The number you entered is already registered',
      text: 'Enter a telephone number that hasn\'t already been registered'
    },
    '*': {
      summary: 'Enter a valid UK mobile number',
      text: 'Enter a valid UK mobile number in the correct format'
    }
  }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const routeId = 'contact-add'

module.exports = [
  {
    method: 'GET',
    path: `/${routeId}`,
    handler: async (request, h) => {
      return h.view(routeId)
    }
  },
  {
    method: 'POST',
    path: `/${routeId}`,
    handler: async (request, h) => {
      const { mobile } = request.payload
      const { id: userId } = request.auth.credentials.user
      const phoneNumber = parsePhoneNumber(mobile)
      console.log(phoneNumber)
      const { e164, type } = phoneNumber

      // Only allow MOBILE
      const isCorrectType = type === types.MOBILE

      if (!isCorrectType) {
        const errors = { mobile: errorMessages.mobile['*'] }
        return h.view(routeId, new Model(request.payload, errors))
      }

      const user = await getUser(userId)

      // check if the number already exists
      const existingPhoneNumber = user.phoneNumbers.find(x => x.number === e164)
      if (existingPhoneNumber) {
        const errors = { mobile: errorMessages.mobile.unique }
        return h.view(routeId, new Model(request.payload, errors))
      }

      // Check there aren't too many personal phone numbers already
      if (user.phoneNumbers.filter(x => x.type === 'personal').length >= maxPersonalPhoneNumbers) {
        const errors = { mobile: errorMessages.mobile.tooMany }
        // Potentially return the account view
        return h.view(routeId, new Model(request.payload, errors))
      }

      user.phoneNumbers.push({
        id: uuid(),
        type: 'personal',
        number: e164,
        subscribedTo: [user.officeLocation]
      })

      const response = await updateUser(user)
      if (response.statusCode !== 200) {
        boom.internal('Error updating user.', response)
      }

      return h.redirect('/account')
    },
    options: {
      validate: {
        payload: Joi.object().keys({
          mobile: Joi.string().required()
        }),
        failAction: (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view(routeId, new Model(request.payload, errors)).takeover()
        }
      }
    }
  }
]
