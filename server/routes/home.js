const { roles, scopes } = require('../permissions')

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      const authenticated = request.auth.isAuthenticated
      let role
      if (authenticated) {
        const scope = request.auth.credentials.scope
        if (scope.includes(scopes.message.manage)) {
          role = roles.Administrator
        } else if (scope.includes(scopes.data.manage)) {
          role = roles.DataManager
        } else {
          role = roles.User
        }
      }
      return h.view('home', { authenticated, role, roles })
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  }
]
