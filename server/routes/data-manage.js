const { scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/data-manage',
    handler: (request, h) => {
      return h.view('data-manage')
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
