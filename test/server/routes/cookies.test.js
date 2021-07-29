const cheerio = require('cheerio')
const createServer = require('../../../server/index')

describe('Cookies route', () => {
  const url = '/cookies'
  let server

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 200 when no user is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toMatch('Cookies')
  })

  test('responds with 200 when user with no scope is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: []
            }
          },
          scope: []
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toMatch('Cookies')
  })
})
