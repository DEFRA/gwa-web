const { navigation: { header } } = require('../constants')
const getNavigation = require('../lib/view/get-navigation')
const { scopes } = require('../permissions')

function getNavItem (request) {
  const pathToMatch = `/${request.path.split('/')[1]}`
  if ([header.home.href].includes(pathToMatch)) {
    return header.home.text
  }

  if ([header.account.href, '/contact-add', '/contact-edit', '/contact-remove'].includes(pathToMatch)) {
    return header.account.text
  }

  if ([header.data.href, '/data-reference', '/data-reference-manage', '/phone-numbers', '/org-data', '/org-data-delete', '/org-data-download', '/org-data-upload'].includes(pathToMatch)) {
    return header.data.text
  }

  if ([header.messages.href, '/message-create', '/message-edit', '/message-delete', '/message-send', '/message-view', '/messages-sent'].includes(pathToMatch)) {
    return header.messages.text
  }

  if ([header.systemStatus.href].includes(pathToMatch)) {
    return header.systemStatus.text
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
      server.ext('onPreResponse', async (request, h) => {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          // Set the auth object onto the top level context
          const { auth } = request
          ctx.auth = auth
          ctx.scopes = scopes

          const navItem = getNavItem(request)

          if (navItem === header.messages.text) {
            ctx.displayBanner = true
            ctx.notifyStatus = await request.server.methods.getNotifyStatusViewData()
          }

          if (ctx.auth.isAuthenticated) {
            ctx.user = auth.credentials.user
            ctx.credentials = auth.credentials
          }

          ctx.navigation = getNavigation(ctx, navItem)

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
