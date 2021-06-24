const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { typeInfo, types } = require('../../../server/lib/reference-data')

describe('Data reference manage route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const baseUrl = '/data-reference-manage'
  let server

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  const routes = [
    { type: types.officeLocations },
    { type: types.orgList },
    { type: types.orgMap }
  ]

  test.each(routes)('responds with 302 when no user is logged in', async ({ type }) => {
    const res = await server.inject({
      method: 'GET',
      url: `${baseUrl}/${type}`
    })

    expect(res.statusCode).toEqual(302)
  })

  test.each(routes)('responds with 403 when user does not have sufficient scope', async ({ type }) => {
    const res = await server.inject({
      method: 'GET',
      url: `${baseUrl}/${type}`,
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

  test.each(routes)('responds with 200 when user has sufficient scope', async ({ type }) => {
    const res = await server.inject({
      method: 'GET',
      url: `${baseUrl}/${type}`,
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
    const { download, filename, heading } = typeInfo[type]
    expect($('.govuk-heading-xl').text()).toMatch(heading)

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(2)
    expect(buttons.eq(0).text()).toMatch('Download')
    expect(buttons.eq(0).attr('href')).toEqual(`/data-reference-download/${filename}`)
    expect(buttons.eq(0).attr('download')).toEqual(download)
    expect(buttons.eq(1).text()).toMatch('Upload')
  })
})
