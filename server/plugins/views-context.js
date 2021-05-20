const config = require('../config')
const { scopes } = require('../permissions')

/*
* Adds an `onPreResponse` listener to apply
* some common props to the view context
*/

module.exports = {
  plugin: {
    name: 'views-context',
    register: (server, options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          // Set the auth object
          // onto the top level context
          const { auth } = request

          ctx.auth = auth
          ctx.scopes = scopes

          const navigation = []

          if (auth.isAuthenticated) {
            ctx.user = auth.credentials.user
            ctx.credentials = auth.credentials

            navigation.push(
              {
                href: '/messages',
                text: 'Messages',
                active: request.path === '/messages'
              },
              {
                href: '/account',
                text: 'Account',
                active: request.path === '/account'
              },
              {
                href: config.documentationHomePage,
                text: 'Documentation'
              },
              {
                href: config.websiteHomePage,
                text: 'Website'
              },

            )

            if (ctx.credentials.scope.includes(scopes.system.maintain)) {
              navigation.push({
                href: '/upload',
                text: 'Upload',
                active: request.path === '/upload'
              })
            }

            navigation.push({
              href: '/logout',
              text: 'Sign out'
            })
          } else {
            navigation.push({
              href: '/login',
              text: 'Sign in'
            })
          }

          ctx.navigation = navigation

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
