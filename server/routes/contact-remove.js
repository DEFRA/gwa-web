const boom = require('@hapi/boom')
const Joi = require('joi')

const { phoneNumberTypes } = require('../constants')
const { updateUser } = require('../lib/db')
const BaseModel = require('../lib/model')
const { getUser } = require('../lib/route-pre-handlers')

class Model extends BaseModel {}

const routeId = 'contact-remove'
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

      return h.view(routeId, new Model({ isCorporate, phoneNumber }))
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
      const user = request.pre.user
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)
      if (phoneNumber.type === phoneNumberTypes.corporate) {
        return boom.forbidden(`Unable to remove ${phoneNumberTypes.corporate} phone number.`)
      }

      user.phoneNumbers = user.phoneNumbers.filter(x => x.id !== phoneNumberId)
      await updateUser(user)

      return h.redirect('/account')
    },
    options: {
      pre: [getUser],
      validate: {
        params: Joi.object().keys({
          phoneNumberId: Joi.string().guid().required()
        })
      }
    }
  }
]
