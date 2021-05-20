const hapi = require('@hapi/hapi')
const config = require('./config')

async function createServer () {
  const server = hapi.server({
    port: config.port,
    host: config.host,
    routes: {
      auth: {
        mode: 'required'
      },
      validate: {
        options: {
          abortEarly: false,
          stripUnknown: true
        }
      },
      security: true
    },
    router: {
      stripTrailingSlash: true
    }
  })

  // Register the plugins
  await server.register(require('@hapi/inert'))
  await server.register(require('@hapi/cookie'))
  await server.register(require('@hapi/bell'))
  await server.register(require('./plugins/auth'))
  await server.register(require('./plugins/session'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/views-context'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/logging'))
  await server.register(require('blipp'))

  return server
}

module.exports = createServer
