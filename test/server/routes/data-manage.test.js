const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Data manage route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/data-manage'
  let server

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
          scope: [scopes.data.manage]
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-xl').text()).toMatch('Manage data')
    const button = $('.govuk-button')
    expect(button).toHaveLength(2)
    expect(button.eq(0).text()).toMatch('Upload')
    expect(button.eq(0).attr('href')).toEqual('/upload')
    expect(button.eq(1).text()).toMatch('Reference data')
    expect(button.eq(1).attr('href')).toEqual('/data-reference')
  })
})
