const hapi = require('@hapi/hapi')

const config = require('./config')
const { messageStates: { sent } } = require('./constants')
const { getAreaToOfficeMap, getMessages, getOrganisationList, getStandardisedOfficeLocationMap, getUsers } = require('./lib/db')
const getNotifyStatusViewData = require('./lib/get-notify-status-view-data')

async function createServer () {
  const server = hapi.server({
    host: config.host,
    port: config.port,
    router: {
      stripTrailingSlash: true
    },
    routes: {
      auth: {
        mode: 'required'
      },
      security: true,
      validate: {
        options: {
          abortEarly: false,
          stripUnknown: true
        }
      }
    }
  })

  // Areas and offices change infrequently. Expire cache hourly. Query _should_ take < 2 seconds, allows 10 seconds before error.
  server.method('db.getAreaToOfficeMap', getAreaToOfficeMap, { cache: { expiresIn: 60 * 60 * 1000, generateTimeout: 10 * 1000 } })
  // Organisations change infrequently. Expire cache hourly. Query _should_ take < 2 seconds, allows 10 seconds before error.
  server.method('db.getOrganisationList', getOrganisationList, { cache: { expiresIn: 60 * 60 * 1000, generateTimeout: 10 * 1000 } })
  // Office locations change infrequently. Expire cache hourly. Query _should_ take < 2 seconds, allows 10 seconds before error.
  server.method('db.getStandardisedOfficeLocationMap', getStandardisedOfficeLocationMap, { cache: { expiresIn: 60 * 60 * 1000, generateTimeout: 10 * 1000 } })
  // Users are scheduled to refresh weekly. Expire cache daily. Query _should_ take ~10 seconds, allows 3x before error.
  server.method('db.getUsers', getUsers, { cache: { expiresAt: '00:05', generateTimeout: 30 * 1000 } })
  // Notify status doesn't change frequently but is important to be up to date. Expire cache every 5 minutes. Query _should_ take < 2 seconds, allows 10 seconds before error.
  server.method('getNotifyStatusViewData', getNotifyStatusViewData, { cache: { expiresIn: 5 * 60 * 1000, generateTimeout: 10 * 1000 } })
  // Messages are sent infrequently. Expire cache daily. Query _should_ take < 1 second, allow 10 seconds before error.
  server.method('db.getSentMessages', async () => getMessages(`SELECT * FROM c WHERE c.state = "${sent}"`), { cache: { expiresAt: '00:10', generateTimeout: 10 * 1000 } })

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
