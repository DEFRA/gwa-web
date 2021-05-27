const boom = require('@hapi/boom')

const BaseModel = require('../lib/model')
const { getUser } = require('../lib/db')
const { maxPersonalPhoneNumbers } = require('../config')
const { phoneNumberTypes } = require('../constants')

class Model extends BaseModel {}

function getPhoneNumbersForView (contact) {
  return [
    {
      text: contact.number
    },
    {
      html: `member of <b>${contact.subscribedTo?.length}</b> ${contact.subscribedTo?.length === 1 ? 'group' : 'groups'}`
    },
    {
      html: `<a class="govuk-button govuk-button--secondary" href="/contact-edit/${encodeURIComponent(contact.id)}" style="margin-bottom: 0">Edit</a>`
    }
  ]
}

module.exports = [
  {
    method: 'GET',
    path: '/account',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const { roles, user: { id: userId } } = credentials
      // const user = request.yar.get(userId)
      console.log('searching for', userId)
      const user = await getUser(userId)

      if (!user) {
        return boom.notFound(`No record found for ${userId}.`)
      }

      const corporatePhoneNumbers = user.phoneNumbers.filter(x => x.type === phoneNumberTypes.corporate).map(getPhoneNumbersForView)
      const personalPhoneNumbers = user.phoneNumbers.filter(x => x.type === phoneNumberTypes.personal).map(getPhoneNumbersForView)

      return h.view('account', new Model({ corporatePhoneNumbers, maxPersonalPhoneNumbers, personalPhoneNumbers, roles, user }))
    }
  }
]
