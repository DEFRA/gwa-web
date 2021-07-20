const boom = require('@hapi/boom')
const Joi = require('joi')

const { phoneNumberTypes } = require('../constants')
const { updateUser } = require('../lib/db')
const BaseModel = require('../lib/misc/model')
const { getUser } = require('../lib/route/route-pre-handlers')

class Model extends BaseModel {}

const routeId = 'contact-remove'
const path = `/${routeId}/{phoneNumberId}`

const options = {
  pre: [getUser],
  validate: {
    params: Joi.object().keys({
      phoneNumberId: Joi.string().guid().required()
    })
  }
}

function verifyRequest (request) {
  const { phoneNumberId } = request.params
  const user = request.pre.user
  const phoneNumber = user.phoneNumbers.find(x => x.id === phoneNumberId)

  if (!phoneNumber) {
    return { error: boom.notFound('Phone number not found.') }
  }

  if (phoneNumber.type === phoneNumberTypes.corporate) {
    return { error: boom.forbidden(`Unable to remove ${phoneNumberTypes.corporate} phone number.`) }
  }
  return { phoneNumber }
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const { error, phoneNumber } = verifyRequest(request)
      if (error) { return error }

      return h.view(routeId, new Model({ phoneNumber }))
    },
    options
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { error, phoneNumber } = verifyRequest(request)
      if (error) { return error }

      const user = request.pre.user

      user.phoneNumbers = user.phoneNumbers.filter(x => x.id !== phoneNumber.id)
      await updateUser(user)

      return h.redirect('/account')
    },
    options
  }
]
