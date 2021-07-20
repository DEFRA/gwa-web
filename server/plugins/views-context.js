const { scopes } = require('../permissions')
const { navigation: { header } } = require('../constants')

/**
 * Adds an `onPreResponse` listener to apply
 * some common props to the view context.
 */
module.exports = {
  plugin: {
    name: 'views-context',
    register: (server, options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          // Set the auth object onto the top level context
          const { auth } = request

          ctx.auth = auth
          ctx.scopes = scopes

          const navigation = []

          if (auth.isAuthenticated) {
            ctx.user = auth.credentials.user
            ctx.credentials = auth.credentials
            navigation.push({
              ...header.account,
              active: request.path === '/account'
            })

            if (ctx.credentials.scope.includes(scopes.message.manage)) {
              navigation.push({
                ...header.messages,
                active: request.path === '/messages'
              })
            }

            if (ctx.credentials.scope.includes(scopes.data.manage)) {
              navigation.push({
                ...header.data,
                active: request.path === '/data-manage'
              })
            }

            navigation.push(header.signOut)
          } else {
            navigation.push(header.signIn)
          }

          ctx.navigation = navigation

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
