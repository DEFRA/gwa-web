const config = require('../config')

module.exports = {
  plugin: {
    name: 'auth',
    register: (server, options) => {
      server.auth.strategy('azuread', 'bell', {
        provider: 'azure-legacy',
        password: config.cookie.password,
        clientId: config.aadClientId,
        clientSecret: config.aadClientSecret,
        isSecure: config.cookie.isSecure,
        forceHttps: config.forceHttps,
        config: {
          tenant: config.aadTenantId
        },
        profileParams: {
          redirect_uri: config.logoutRedirectUri
        }
      })

      // 30 mins sliding auth cookie
      server.auth.strategy('session', 'cookie', {
        cookie: {
          path: '/',
          password: config.cookie.password,
          isSecure: config.cookie.isSecure,
          ttl: 30 * 60 * 1000
        },
        keepAlive: true,
        redirectTo: '/login',
        appendNext: 'redirectTo'
      })

      server.auth.default('session')
    }
  }
}
