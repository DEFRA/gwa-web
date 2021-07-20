const { scopes } = require('../permissions')
const { navigation: { header } } = require('../constants')

function getView (request) {
  const pathToMatch = `/${request.path.split('/')[1]}`
  if ([header.messages.href, '/message-create', '/message-edit', '/message-delete', '/message-send', '/message-view', '/messages-sent'].includes(pathToMatch)) {
    return header.messages.text
  }

  if ([header.account.href, '/contact-add', '/contact-edit', '/contact-remove'].includes(pathToMatch)) {
    return header.account.text
  }

  if ([header.data.href, '/data-reference', '/data-reference-manage', '/upload'].includes(pathToMatch)) {
    return header.data.text
  }
}
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

          const view = getView(request)

          if (auth.isAuthenticated) {
            ctx.user = auth.credentials.user
            ctx.credentials = auth.credentials
            navigation.push({
              ...header.account,
              active: view === header.account.text
            })

            if (ctx.credentials.scope.includes(scopes.message.manage)) {
              navigation.push({
                ...header.messages,
                active: view === header.messages.text
              })
            }

            if (ctx.credentials.scope.includes(scopes.data.manage)) {
              navigation.push({
                ...header.data,
                active: view === header.data.text
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
