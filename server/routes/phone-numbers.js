const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../config')
const checkFileExists = require('../lib/data/check-file-exists')
const { scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/phone-numbers',
    handler: async (request, h) => {
      const fileExists = await checkFileExists(phoneNumbersStorageConnectionString, phoneNumbersContainer, 'phone-numbers.csv')
      return h.view('phone-numbers', { fileExists })
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
