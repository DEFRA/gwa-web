const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const { navigation } = require('../../../server/constants')

describe('Contact remove route', () => {
  const mockCorporatePhoneNumber = '07777111111'
  const mockCorporatePhoneNumberId = uuid()
  const mockPersonalPhoneNumber = '07777222222'
  const mockPersonalPhoneNumberId = uuid()
  const email = 'test@gwa.defra.co.uk'
  const id = uuid()
  const toDeleteNumberId = uuid()
  const url = `/contact-remove/${mockCorporatePhoneNumberId}`
  let server

  const activeUserWithPhoneNumbers = {
    active: true,
    phoneNumbers: [
      { id: mockCorporatePhoneNumberId, type: 'corporate', number: mockCorporatePhoneNumber, subscribedTo: ['COR:office-one'] },
      { id: mockPersonalPhoneNumberId, type: 'personal', number: mockPersonalPhoneNumber, subscribedTo: ['PER:office-one', 'PER:office-two'] }
    ]
  }
  jest.mock('../../../server/lib/db')
  const { getUser, updateUser } = require('../../../server/lib/db')
  getUser
  // GET requests
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ active: false })
    .mockResolvedValueOnce({ active: true, phoneNumbers: [] })
    .mockResolvedValueOnce(activeUserWithPhoneNumbers)
    .mockResolvedValueOnce(activeUserWithPhoneNumbers)
  // POST requests
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ active: false })
    .mockResolvedValueOnce(activeUserWithPhoneNumbers)
    .mockResolvedValueOnce({ active: true, phoneNumbers: [{ id: toDeleteNumberId, type: 'personal' }] })
    .mockResolvedValueOnce(activeUserWithPhoneNumbers)

  const createServer = require('../../../server/index')

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('GET requests', () => {
    const method = 'GET'

    test('responds with 302 when no user is logged in', async () => {
      const res = await server.inject({
        method,
        url
      })

      expect(res.statusCode).toEqual(302)
    })

    test('responds with 404 when user is not found', async () => {
      const res = await server.inject({
        method,
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
        method,
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
        method,
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

    test('responds with 400 when phone number is not a guid', async () => {
      const res = await server.inject({
        method,
        url: '/contact-remove/not-a-guid',
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

      expect(res.statusCode).toEqual(400)
      const $ = cheerio.load(res.payload)
      const body = $('.govuk-body').text()
      expect(body).toMatch('Invalid request params input')
    })

    test('responds with 403 when phone number is corporate', async () => {
      const res = await server.inject({
        method,
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
      const body = $('.govuk-body').text()
      expect(body).toMatch('Unable to remove corporate phone number.')
    })

    test('responds with 200 and correct view for corporate phone number when active user logged in', async () => {
      const res = await server.inject({
        method,
        url: `/contact-remove/${mockPersonalPhoneNumberId}`,
        auth: {
          credentials: {
            user: {
              id,
              email,
              displayName: 'test gwa',
              officeCode: 'ABC:office-code',
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
      expect($('.govuk-heading-l').text()).toMatch('Are you sure?')
      expect($('.govuk-warning-text__text').text()).toMatch(`Warning\n    You will no longer receive alerts for ${mockPersonalPhoneNumber}`)
      const buttons = $('.govuk-button')
      expect(buttons).toHaveLength(2)
      expect(buttons.eq(0).text()).toMatch('Cancel')
      expect(buttons.eq(1).text()).toMatch('Continue')
      expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.account.text)
      expect($('.govuk-phase-banner')).toHaveLength(0)
    })
  })

  describe('POST requests', () => {
    const method = 'POST'

    test('responds with 302 when no user is logged in', async () => {
      const res = await server.inject({
        method,
        url
      })

      expect(res.statusCode).toEqual(302)
    })

    test('responds with 404 when user is not found', async () => {
      const res = await server.inject({
        method,
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
        method,
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

    test('responds with 403 when attempting to remove corporate phone number', async () => {
      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              id,
              email,
              displayName: 'test gwa',
              officeCode: 'ABC:office-code',
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
      expect($('.govuk-body').text()).toEqual('Unable to remove corporate phone number.')
    })

    test('responds with 302 to /account when attempting to remove phone number is successful', async () => {
      const res = await server.inject({
        method,
        url: `/contact-remove/${toDeleteNumberId}`,
        auth: {
          credentials: {
            user: {
              id,
              email,
              displayName: 'test gwa',
              officeCode: 'ABC:office-code',
              raw: {
                roles: JSON.stringify([])
              }
            },
            scope: []
          },
          strategy: 'azuread'
        }
      })

      expect(res.statusCode).toEqual(302)
      expect(updateUser).toBeCalledWith(expect.objectContaining({
        active: true,
        phoneNumbers: []
      }))
    })

    test('responds with 404 when attempting to remove phone number that does not exist', async () => {
      const res = await server.inject({
        method,
        url: `/contact-remove/${uuid()}`,
        auth: {
          credentials: {
            user: {
              id,
              email,
              displayName: 'test gwa',
              officeCode: 'ABC:office-code',
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
  })
})
