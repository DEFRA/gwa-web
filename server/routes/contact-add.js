const boom = require('@hapi/boom')
const Joi = require('joi')
const { v4: uuid } = require('uuid')

const { contacts: { maxPersonalPhoneNumbers }, phoneNumberTypes } = require('../constants')
const { updateUser } = require('../lib/db')
const { getMappedErrors } = require('../lib/misc/errors')
const { getAreaOfficeCode } = require('../lib/misc/helpers')
const BaseModel = require('../lib/misc/model')
const { parsePhoneNumber, types } = require('../lib/contact/phone-number')
const { getUser } = require('../lib/route/route-pre-handlers')

const errorMessages = {
  mobile: {
    tooMany: {
      summary: `Only ${maxPersonalPhoneNumbers} personal phone number can be registered`,
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

function isNumberAlreadyRegistered (user, e164) {
  return user.phoneNumbers.find(x => x.number === e164)
}

function isNumberMobile (type) {
  return type === types.MOBILE
}

function areMaxNumbersAlreadyRegistered (user) {
  return user.phoneNumbers.filter(x => x.type === phoneNumberTypes.personal).length >= maxPersonalPhoneNumbers
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      return h.view(routeId)
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { mobile } = request.payload
      const { e164, type } = parsePhoneNumber(mobile)

      if (!isNumberMobile(type)) {
        return h.view(routeId, new Model(request.payload, { mobile: errorMessages.mobile['*'] }))
      }

      const user = request.pre.user

      if (isNumberAlreadyRegistered(user, e164)) {
        return h.view(routeId, new Model(request.payload, { mobile: errorMessages.mobile.unique }))
      }

      if (areMaxNumbersAlreadyRegistered(user)) {
        return h.view(routeId, new Model(request.payload, { mobile: errorMessages.mobile.tooMany }))
      }

      user.phoneNumbers.push({
        id: uuid(),
        type: phoneNumberTypes.personal,
        number: e164,
        subscribedTo: [getAreaOfficeCode(user)]
      })

      const response = await updateUser(user)
      if (response.statusCode !== 200) {
        return boom.internal('Error updating user.', response)
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
