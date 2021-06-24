const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Message deletion route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = `/message-delete/${uuid()}`
  let server

  jest.mock('../../../server/lib/db', () => {
    return {
      getMessage: jest.fn().mockResolvedValue({ auditEvents: [{ user: { id: 'me' }, type: 'create' }], orgCodes: [], officeCodes: [], state: 'created' })
    }
  })

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 302 when no user is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url
    })

    expect(res.statusCode).toEqual(302)
  })

  test('responds with 403 when user does not have sufficient scope', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id,
            email,
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify([])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(403)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-body').text()).toEqual('Insufficient scope')
  })

  test('responds with 200 when user has sufficient scope', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id,
            email,
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify([])
            }
          },
          scope: [scopes.message.manage]
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    const title = $('.govuk-heading-l').text()
    expect(title).toMatch('Delete message')
    // TODO: extend the range of what is being tested
  })
})
