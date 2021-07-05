const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')

describe('Contact edit route', () => {
  const mockCorporatePhoneNumber = '07777111111'
  const mockCorporatePhoneNumberId = uuid()
  const mockPersonalPhoneNumber = '07777222222'
  const mockPersonalPhoneNumberId = uuid()
  const email = 'test@gwa.defra.co.uk'
  const id = uuid()
  const url = `/contact-edit/${mockCorporatePhoneNumberId}`
  let server
  const officeCode = 'XYZ:location'

  jest.mock('../../../server/lib/db')
  const { getAreaToOfficeMap, getUser, updateUser } = require('../../../server/lib/db')
  getAreaToOfficeMap
    .mockResolvedValue([
      { areaCode: 'COR', areaName: 'Corporate', officeLocations: [{ officeCode: 'COR:office-one', officeLocation: 'office one' }] },
      { areaCode: 'PER', areaName: 'Personal', officeLocations: [{ officeCode: 'PER:office-one', officeLocation: 'office one' }, { officeCode: 'PER:office-two', officeLocation: 'office two' }] }
    ])
  const activeUserWithPhoneNumbers = {
    active: true,
    officeCode,
    phoneNumbers: [
      { id: mockCorporatePhoneNumberId, type: 'corporate', number: mockCorporatePhoneNumber, subscribedTo: ['COR:office-one'] },
      { id: mockPersonalPhoneNumberId, type: 'personal', number: mockPersonalPhoneNumber, subscribedTo: ['PER:office-one', 'PER:office-two'] }
    ]
  }
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
    .mockResolvedValueOnce({ active: true, phoneNumbers: [] })
    .mockResolvedValueOnce(activeUserWithPhoneNumbers)
    .mockResolvedValueOnce(activeUserWithPhoneNumbers)
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
        url: '/contact-edit/not-a-guid',
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

    test('responds with 200 and correct view for corporate phone number when active user logged in', async () => {
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

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      const heading = $('.govuk-heading-l').text()
      expect(heading).toMatch(`Corporate phone number: ${mockCorporatePhoneNumber}`)
      const removeContactButton = $('.govuk-button--danger')
      expect(removeContactButton).toHaveLength(0)
    })

    test('responds with 200 and correct view for personal phone number when active user logged in', async () => {
      const res = await server.inject({
        method,
        url: `/contact-edit/${mockPersonalPhoneNumberId}`,
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
      const heading = $('.govuk-heading-l').text()
      expect(heading).toMatch(`Personal phone number: ${mockPersonalPhoneNumber}`)
      const removeContactButton = $('.govuk-button--danger')
      expect(removeContactButton).toHaveLength(1)
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
        },
        payload: {
          officeCodes: ['ABC:office']
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
        },
        payload: {
          officeCodes: ['ABC:office']
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
        },
        payload: {
          officeCodes: ['ABC:office']
        }
      })

      expect(res.statusCode).toEqual(404)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Phone number not found.')
    })

    test('responds with 500 when problem updating user', async () => {
      updateUser.mockResolvedValueOnce({ statusCode: 500 })
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
        },
        payload: {
          officeCodes: ['ABC:office']
        }
      })

      expect(res.statusCode).toEqual(500)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Please try again later.')
    })

    test('responds with 302 to /account and updates user when user is updated for corporate number', async () => {
      const newOfficeCode = 'ABC:office'
      updateUser.mockResolvedValueOnce({ statusCode: 200 })

      const res = await server.inject({
        method,
        url: `/contact-edit/${mockCorporatePhoneNumberId}`,
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
        },
        payload: {
          officeCodes: [newOfficeCode]
        }
      })

      expect(res.statusCode).toEqual(302)
      expect(res.headers.location).toEqual('/account')
      expect(updateUser).toBeCalledWith(expect.objectContaining({
        phoneNumbers: expect.arrayContaining([{ id: mockCorporatePhoneNumberId, number: mockCorporatePhoneNumber, subscribedTo: [newOfficeCode, officeCode], type: 'corporate' }])
      }))
    })

    test('responds with 302 to /account and updates user when user is updated for personal number', async () => {
      const newOfficeCode = 'ABC:office'
      updateUser.mockResolvedValueOnce({ statusCode: 200 })

      const res = await server.inject({
        method,
        url: `/contact-edit/${mockPersonalPhoneNumberId}`,
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
        },
        payload: {
          officeCodes: [newOfficeCode]
        }
      })

      expect(res.statusCode).toEqual(302)
      expect(res.headers.location).toEqual('/account')
      expect(updateUser).toBeCalledWith(expect.objectContaining({
        phoneNumbers: expect.arrayContaining([{ id: mockPersonalPhoneNumberId, number: mockPersonalPhoneNumber, subscribedTo: [newOfficeCode], type: 'personal' }])
      }))
    })

    test('responds with 400 when phone number is not a guid', async () => {
      const res = await server.inject({
        method,
        url: '/contact-edit/not-a-guid',
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
        },
        payload: {
          officeCodes: ['ABC:office']
        }
      })

      expect(res.statusCode).toEqual(400)
      const $ = cheerio.load(res.payload)

      const body = $('.govuk-body').text()
      expect(body).toMatch('Invalid request params input')
    })

    test('responds with 400 when office codes are not included in request', async () => {
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

      expect(res.statusCode).toEqual(400)
      const $ = cheerio.load(res.payload)

      const body = $('.govuk-body').text()
      expect(body).toMatch('Invalid request payload input')
    })
  })
})
