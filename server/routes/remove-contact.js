const boom = require('@hapi/boom')
const joi = require('joi')
const BaseModel = require('../lib/model')
const { getUser, updateUser } = require('../lib/db')

class Model extends BaseModel {}

module.exports = [
  {
    method: 'GET',
    path: '/remove-contact/{phoneNumberId}',
    handler: async (request, h) => {
      const { id: userId } = request.auth.credentials.user
      const { phoneNumberId } = request.params

      const user = await getUser(userId)
      const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)

      if (!phoneNumber) {
        return boom.notFound('Phone number not found.')
      }
      const isCorporate = phoneNumber.type === 'corporate'

      return h.view('remove-contact', new Model({ isCorporate, phoneNumber }))
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
    path: '/remove-contact/{phoneNumberId}',
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
        params: joi.object().keys({
          phoneNumberId: joi.string().guid().required()
        })
      }
    }
  }
]
