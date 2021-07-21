const { scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/data-manage',
    handler: (request, h) => {
      const displayPhoneNumbers = request.auth.credentials.scope.includes(scopes.message.manage)
      return h.view('data-manage', { displayPhoneNumbers })
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
