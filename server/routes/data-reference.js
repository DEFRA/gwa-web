const { scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/data-reference',
    handler: (request, h) => {
      return h.view('data-reference')
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.data.manage}`]
        }
      }
    }
  }
]
