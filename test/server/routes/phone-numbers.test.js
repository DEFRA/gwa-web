const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { navigation } = require('../../../server/constants')

describe('Phone numbers route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/phone-numbers'
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

  test.each([
    { scope: [] },
    { scope: [scopes.data.manage] }
  ])('responds with 403 when user does not have sufficient scope', async ({ scope }) => {
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
          scope
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(403)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-body').text()).toEqual('Insufficient scope')
  })

  test('responds with 200 when user has sufficient scope - admin', async () => {
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
          scope: [scopes.data.manage, scopes.message.manage]
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-xl').text()).toMatch('Phone numbers')
    expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.data.text)
    expect($('.govuk-phase-banner')).toHaveLength(0)

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(2)
    expect(buttons.eq(0).text()).toMatch('Cancel')
    expect(buttons.eq(0).attr('href')).toEqual('/data-manage')
    expect(buttons.eq(1).text()).toMatch('Download')
    expect(buttons.eq(1).attr('href')).toEqual('/phone-numbers-download')
    expect(buttons.eq(1).attr('download')).toEqual('phone-numbers.csv')
  })
})
