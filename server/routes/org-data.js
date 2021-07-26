const { scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/org-data',
    handler: (request, h) => {
      return h.view('org-data')
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
