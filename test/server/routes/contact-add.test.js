const cheerio = require('cheerio')

const createServer = require('../../../server/index')

describe('Contact add route', () => {
  const url = '/contact-add'
  let server

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 302 when no user is logged in - GET', async () => {
    const res = await server.inject({
      method: 'GET',
      url
    })

    expect(res.statusCode).toEqual(302)
  })

  test('responds with 200 when user is logged in - GET', async () => {
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
              roles: JSON.stringify([])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(200)
    const $ = cheerio.load(res.payload)

    const title = $('.govuk-label--l').text()
    expect(title).toMatch('What is your telephone number?')
  })
})
