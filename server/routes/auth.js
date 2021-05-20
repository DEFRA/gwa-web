const boom = require('@hapi/boom')
const config = require('../config')
const { permissions } = require('../permissions')
const { getUser } = require('../lib/db')

function getPermissions (roles) {
  if (roles) {
    const parsedRoles = JSON.parse(roles)

    if (Array.isArray(parsedRoles) && parsedRoles.length) {
      const knownRoles = parsedRoles.filter(role => role in permissions)

      if (knownRoles.length) {
        return [
          knownRoles,
          Array.from(new Set(knownRoles.map(role => permissions[role]).flat()))
        ]
      }
    }
  }

  return []
}

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
      const [roles, scope] = getPermissions(profile.raw.roles)

      // request.log('********************************************************credentials', credentials)
      // request.log('********************************************************profile.raw', profile.raw)

      if (!roles || !scope) {
        return boom.forbidden('Insufficient permissions')
      }

      // Lowercased emails used as ids (at least atm)
      const user = await getUser(email.toLowerCase())

      if (!user) {
        request.log(`Problem encountered whilst looking up email: '${email}', ${user}`)
        return boom.forbidden('Insufficient permissions')
      }

      if (!user.active) {
        return boom.forbidden('Insufficient permissions')
      }

      // Set the authentication cookie
      request.cookieAuth.set({ user, roles, scope })
      // Store user in session
      request.yar.set(user.id, user)

      return h.redirect(credentials.query?.redirectTo || '/account')
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

      return h.redirect(`https://login.microsoftonline.com/${config.aadTenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${config.logoutRedirectUri}`)
    },
    options: {
      auth: false
    }
  }
]
