const { scopes } = require('../../permissions')
const { navigation: { header } } = require('../../constants')

module.exports = (ctx, view) => {
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
    n.active = n.text === view
  })

  return navigation
}
