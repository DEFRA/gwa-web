const cheerio = require('cheerio')
const { navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Org data download route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/org-data-download'
  const orgCode = 'orgCode'
  const orgName = 'orgName'
  let server

  beforeEach(async () => {
    server = await createServer()
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue([{ orgCode, orgName, active: true, core: false }])
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

  test('responds with 200 when user has sufficient scope and request is successful', async () => {
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
    expect($('.govuk-heading-l').text()).toMatch('Download users for an ALB')
    const select = $('#orgCode')
    expect(select).toHaveLength(1)
    const options = $('option', select)
    console.log(options.text())
    expect(options).toHaveLength(2)
    expect(options.eq(0).attr('selected')).toBeDefined()
    expect(options.eq(0).attr('value')).toEqual('')
    expect(options.eq(0).text()).toEqual('Select an organisation')
    expect(options.eq(1).attr('selected')).toBeUndefined()
    expect(options.eq(1).attr('value')).toEqual(orgCode)
    expect(options.eq(1).text()).toEqual(orgName)
    const button = $('.govuk-button')
    expect(button).toHaveLength(1)
    expect(button.text()).toMatch('Download')
    expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.data.text)
    expect($('.govuk-phase-banner')).toHaveLength(0)
  })
})
