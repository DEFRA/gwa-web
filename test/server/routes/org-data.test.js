const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { navigation } = require('../../../server/constants')

describe('Org data route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/org-data'
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
    expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.data.text)
    expect($('.govuk-phase-banner')).toHaveLength(0)
    expect($('.govuk-heading-xl').text()).toMatch('Manage ALB data')

    const headings = $('.govuk-heading-m')
    expect(headings).toHaveLength(3)
    expect(headings.eq(0).text()).toMatch('Delete ALB data')
    expect(headings.eq(1).text()).toMatch('Download ALB data')
    expect(headings.eq(2).text()).toMatch('Upload ALB data')

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(3)
    expect(buttons.eq(0).text()).toMatch('Delete ALB data')
    expect(buttons.eq(1).text()).toMatch('Download ALB data')
    expect(buttons.eq(2).text()).toMatch('Upload ALB data')
  })
})
