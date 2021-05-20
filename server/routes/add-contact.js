const joi = require('joi')
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

module.exports = [
  {
    method: 'GET',
    path: '/add-contact',
    handler: async (request, h) => {
      return h.view('add-contact')
    }
  },
  {
    method: 'POST',
    path: '/add-contact',
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
        return h.view('add-contact', new Model(request.payload, errors))
      }

      const user = await getUser(userId)

      // check if the number already exists
      const existingPhoneNumber = user.phoneNumbers.find(x => x.number === e164)
      if (existingPhoneNumber) {
        const errors = { mobile: errorMessages.mobile.unique }
        return h.view('add-contact', new Model(request.payload, errors))
      }

      // check there aren't too many personal phone numbers already
      if (user.phoneNumbers.filter(x => x.type === 'personal').length >= maxPersonalPhoneNumbers) {
        const errors = { mobile: errorMessages.mobile.tooMany }
        // Potentially return the account view
        return h.view('add-contact', new Model(request.payload, errors))
      }

      user.phoneNumbers.push({
        id: uuid(),
        type: 'personal',
        number: e164,
        subscribedTo: [user.officeLocation]
      })
      await updateUser(user)

      return h.redirect('/account')
    },
    options: {
      validate: {
        payload: joi.object().keys({
          mobile: joi.string().required()
        }),
        failAction: (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view('add-contact', new Model(request.payload, errors)).takeover()
        }
      }
    }
  }
]
