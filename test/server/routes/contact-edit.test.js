const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')

const createServer = require('../../../server/index')

describe('Contact edit route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = `/contact-edit/${uuid()}`
  let server

  jest.mock('../../../server/lib/db', () => {
    return {
      getUser: jest.fn()
        .mockResolvedValue({
          active: true,
          phoneNumbers: [
            { type: 'corporate', number: '07777111111', subscribedTo: ['OFFICE'] },
            { type: 'personal', number: '07777222222', subscribedTo: ['THIS', 'THAT'] }
          ]
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ active: false })
        .mockResolvedValueOnce({ active: true, phoneNumbers: [] })
    }
  })

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

  test('responds with 404 when user is not found', async () => {
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

    expect(res.statusCode).toEqual(404)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-body').text()).toEqual(`No active user found for ${id}.`)
  })

  test('responds with 404 when user is not active', async () => {
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

    expect(res.statusCode).toEqual(404)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-body').text()).toEqual(`No active user found for ${id}.`)
  })

  test('responds with 404 when user\'s phone number is not found', async () => {
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

    expect(res.statusCode).toEqual(404)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-body').text()).toEqual('Phone number not found.')
  })

  test.skip('responds with 200 when user is logged in - GET', async () => {
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
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)
    const $ = cheerio.load(res.payload)

    const title = $('.govuk-label--l').text()
    expect(title).toMatch('whatever the title of the page will be')
  })
})
