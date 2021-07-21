const { scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/phone-numbers',
    handler: (request, h) => {
      return h.view('phone-numbers')
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
