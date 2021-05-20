const config = require('../config')

module.exports = {
  plugin: require('hapi-pino'),
  options: {
    prettyPrint: config.isLocal,
    level: config.isLocal ? 'info' : 'warn'
  }
}
