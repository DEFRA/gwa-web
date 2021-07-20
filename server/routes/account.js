const { contacts: { maxPersonalPhoneNumbers }, phoneNumberTypes } = require('../constants')
const BaseModel = require('../lib/misc/model')
const { getUser } = require('../lib/route/route-pre-handlers')

class Model extends BaseModel {}

function getPhoneNumbersForView (contact) {
  return [
    {
      text: contact.number
    },
    {
      html: `subscribed to <b>${contact.subscribedTo?.length}</b> ${contact.subscribedTo?.length === 1 ? 'area' : 'areas'}`
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
      const { roles } = credentials
      const user = request.pre.user

      const corporatePhoneNumbers = user.phoneNumbers.filter(x => x.type === phoneNumberTypes.corporate).map(getPhoneNumbersForView)
      const personalPhoneNumbers = user.phoneNumbers.filter(x => x.type === phoneNumberTypes.personal).map(getPhoneNumbersForView)

      return h.view('account', new Model({ corporatePhoneNumbers, maxPersonalPhoneNumbers, personalPhoneNumbers, roles, user }))
    },
    options: {
      pre: [getUser]
    }
  }
]
