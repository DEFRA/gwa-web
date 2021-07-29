const { scopes } = require('../../permissions')
const { navigation: { header } } = require('../../constants')

/**
 * Generates navigation to use in in
 * [GOV.UK Header](https://design-system.service.gov.uk/components/header/)
 * component, used in `layout.html`.
 *
 * @param {object} ctx object containing `auth` from te request.
 * @param {string} navItem used to set which nav item will be active.
 * @returns {Array} representing the navigation array.
 */
module.exports = (ctx, navItem) => {
  const { auth } = ctx
  const navigation = [header.home]

  if (auth.isAuthenticated) {
    navigation.push(header.account)

    if (auth.credentials.scope.includes(scopes.message.manage)) {
      navigation.push(header.data, header.messages, header.systemStatus)
    } else if (auth.credentials.scope.includes(scopes.data.manage)) {
      navigation.push(header.data, header.systemStatus)
    }

    navigation.push(header.signOut)
  } else {
    navigation.push(header.signIn)
  }

  navigation.forEach(n => {
    n.active = n.text === navItem
  })

  return navigation
}
