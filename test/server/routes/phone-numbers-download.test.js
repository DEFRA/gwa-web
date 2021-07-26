const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Phone numbers download route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/phone-numbers-download'
  let server

  jest.mock('../../../server/lib/data/download-phone-numbers')
  const downloadPhoneNumbers = require('../../../server/lib/data/download-phone-numbers')

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

  test.each([
    { data: 'phone number\n07700 111111', statusCode: 200 },
    { data: null, statusCode: 204 }
  ])('responds with 2XX when user has sufficient scope and request is successful', async ({ data, statusCode }) => {
    downloadPhoneNumbers.mockResolvedValue(data)
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

    expect(res.statusCode).toEqual(statusCode)
    expect(res.headers).toHaveProperty('content-type')
    expect(res.headers['content-type']).toEqual('text/csv; charset=utf-8')

    expect(downloadPhoneNumbers).toHaveBeenCalled()
    expect(res.result).toEqual(data)
  })
})
