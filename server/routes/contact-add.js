const boom = require('@hapi/boom')
const Joi = require('joi')
const { v4: uuid } = require('uuid')

const BaseModel = require('../lib/model')
const { getMappedErrors } = require('../lib/errors')
const { getUser } = require('../lib/route-pre-handlers')
const { updateUser } = require('../lib/db')
const { parsePhoneNumber, types } = require('../lib/phone-number')
const { phoneNumberTypes } = require('../constants')

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
const path = `/${routeId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      return h.view(routeId)
    }
  },
  {
    // TODO: test this
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { mobile } = request.payload
      const phoneNumber = parsePhoneNumber(mobile)
      const { e164, type } = phoneNumber

      // Only allow MOBILE
      const isCorrectType = type === types.MOBILE

      if (!isCorrectType) {
        const errors = { mobile: errorMessages.mobile['*'] }
        return h.view(routeId, new Model(request.payload, errors))
      }

      const user = request.pre.user

      // check if the number already exists
      const existingPhoneNumber = user.phoneNumbers.find(x => x.number === e164)
      if (existingPhoneNumber) {
        const errors = { mobile: errorMessages.mobile.unique }
        return h.view(routeId, new Model(request.payload, errors))
      }

      // Check there aren't too many personal phone numbers already
      if (user.phoneNumbers.filter(x => x.type === phoneNumberTypes.personal).length >= maxPersonalPhoneNumbers) {
        const errors = { mobile: errorMessages.mobile.tooMany }
        // Potentially return the account view
        return h.view(routeId, new Model(request.payload, errors))
      }

      user.phoneNumbers.push({
        id: uuid(),
        type: phoneNumberTypes.personal,
        number: e164,
        subscribedTo: [user.officeCode]
      })

      const response = await updateUser(user)
      if (response.statusCode !== 200) {
        boom.internal('Error updating user.', response)
      }

      return h.redirect('/account')
    },
    options: {
      pre: [getUser],
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
