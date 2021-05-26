const boom = require('@hapi/boom')
const Joi = require('joi')
const BaseModel = require('../lib/model')
const { getUser, updateUser } = require('../lib/db')

class Model extends BaseModel {}

const routeId = 'contact-remove'
const path = `/${routeId}/{phoneNumberId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { id: userId } = request.auth.credentials.user
      const { phoneNumberId } = request.params

      const user = await getUser(userId)
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)

      if (!phoneNumber) {
        return boom.notFound('Phone number not found.')
      }
      const isCorporate = phoneNumber.type === 'corporate'

      return h.view(routeId, new Model({ isCorporate, phoneNumber }))
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

      const user = await getUser(userId)
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)
      if (phoneNumber.type === 'corporate') {
        return boom.forbidden('Unable to remove corporate phone number.')
      }

      user.phoneNumbers = user.phoneNumbers.filter(x => x.id !== phoneNumberId)
      await updateUser(user)

      return h.redirect('/account')
    },
    options: {
      validate: {
        params: Joi.object().keys({
          phoneNumberId: Joi.string().guid().required()
        })
      }
    }
  }
]
