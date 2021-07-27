const { roles, scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/system-status',
    handler: (request, h) => {
      // TODO: get some status information
      return h.view('system-status')
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } }
    }
  }
]
