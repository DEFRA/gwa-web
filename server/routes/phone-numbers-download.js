const downloadPhoneNumbers = require('../lib/data/download-phone-numbers')

const { scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/phone-numbers-download',
    handler: async (request, h) => {
      const phoneNumbers = await downloadPhoneNumbers()
      console.log(phoneNumbers)
      return h.response(phoneNumbers).header('Content-Type', 'text/csv')
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.message.manage}`]
        }
      }
    }
  }
]
