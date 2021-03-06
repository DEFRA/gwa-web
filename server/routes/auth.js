const boom = require('@hapi/boom')

const config = require('../config')
const { getPermissions } = require('../permissions')
const { getUser } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/login',
    handler: async (request, h) => {
      if (!request.auth.isAuthenticated) {
        const message = request.auth.error && request.auth.error.message
        return boom.unauthorized(`Authentication failed due to: ${message}`)
      }

      const { credentials } = request.auth
      const { profile } = credentials
      const { email } = profile
      const { roles, scope } = getPermissions(profile.raw.roles)

      // Lowercased emails used as ids (at least atm)
      const user = await getUser(email.toLowerCase())

      if (!user || !user.active) {
        request.log(`Problem encountered whilst looking up email: '${email}', ${user}`)
        return boom.notFound('No active user found.')
      }

      request.cookieAuth.set({ user, roles, scope })

      return h.redirect(credentials.query?.redirectTo || '/')
    },
    options: {
      auth: 'azuread'
    }
  },
  {
    method: 'GET',
    path: '/logout',
    handler: function (request, h) {
      request.cookieAuth.clear()

      return h.redirect(`https://login.microsoftonline.com/${config.aadTenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${config.logoutRedirectUri}`)
    },
    options: {
      auth: false
    }
  }
]
