const cheerio = require('cheerio')
const createServer = require('../../../server/index')

describe('Contact add route', () => {
  const officeCode = 'ABC:office'
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const url = '/contact-add'
  let server

  jest.mock('../../../server/lib/db')
  const { getUser, updateUser } = require('../../../server/lib/db')

  getUser
    .mockResolvedValue({ active: true, phoneNumbers: [], officeCode })
    .mockResolvedValueOnce({ active: false })
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ active: true, phoneNumbers: [{ number: '+447777111111' }] })
    .mockResolvedValueOnce({ active: true, phoneNumbers: [{ number: '07777111111', type: 'personal' }, { number: '07777111111', type: 'personal' }] })

  beforeEach(async () => {
    jest.clearAllMocks()
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

    test('responds with 200 when logged in user is found and active', async () => {
      const res = await server.inject({
        method,
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

      expect($('.govuk-label--l').text()).toMatch('What is your telephone number?')
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

    test('responds with 404 when no user found', async () => {
      const id = 'my-id'
      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              id
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: '07777111111'
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
              id: 'id'
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: '07777111111'
        }
      })

      expect(res.statusCode).toEqual(404)
    })

    test('responds with 200 and errors when mobile is not valid', async () => {
      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            auth: {
              id: 'guid'
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: ''
        }
      })

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      const errorMessage = $('.govuk-error-summary__list').text()
      expect(errorMessage).toMatch('Enter a valid UK mobile number')
    })

    test('responds with 200 and errors when mobile already exists', async () => {
      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              id: 'guid'
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: '07777111111'
        }
      })

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      const errorMessage = $('.govuk-error-summary__list').text()
      expect(errorMessage).toMatch('The number you entered is already registered')
    })

    test('responds with 200 and errors when max phone numbers already exist', async () => {
      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              id: 'guid'
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: '07700111111'
        }
      })

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      const errorMessage = $('.govuk-error-summary__list').text()
      expect(errorMessage).toMatch('The maximum number (2) of personal phone numbers is already taken')
    })

    test('responds with 200 and errors when phone number is not mobile', async () => {
      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              id: 'guid'
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: '01000111111'
        }
      })

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      const errorMessage = $('.govuk-error-summary__list').text()
      expect(errorMessage).toMatch('Enter a valid UK mobile number')
    })

    test('responds with 500 when problem updating user', async () => {
      updateUser.mockResolvedValueOnce({ statusCode: 500 })

      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              id: 'guid'
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: '07777111111'
        }
      })

      expect(res.statusCode).toEqual(500)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-grid-column-two-thirds').text()).toMatch('Sorry, there is a problem with the service')
    })

    test('responds with 302 to /account when user is updated', async () => {
      updateUser.mockResolvedValueOnce({ statusCode: 200 })

      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              id: 'guid'
            },
            scope: []
          },
          strategy: 'azuread'
        },
        payload: {
          mobile: '07777111222'
        }
      })

      expect(res.statusCode).toEqual(302)
      expect(res.headers.location).toEqual('/account')
      expect(updateUser).toBeCalled()
      expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({
        active: true,
        officeCode,
        phoneNumbers: [{
          id: expect.stringMatching(uuidRegex),
          number: '+447777111111',
          subscribedTo: [officeCode],
          type: 'personal'
        }, {
          id: expect.stringMatching(uuidRegex),
          number: '+447777111222',
          subscribedTo: [officeCode],
          type: 'personal'
        }]
      }))
    })
  })
})
