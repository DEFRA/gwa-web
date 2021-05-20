const { cookie } = require('../config')

module.exports = {
  plugin: require('@hapi/yar'),
  options: {
    cookieOptions: {
      isHttpOnly: true,
      ...cookie
    }
  }
}
