const { Readable } = require('stream')

const cheerio = require('cheerio')
const FormData = require('form-data')
const getStream = require('get-stream')
const { v4: uuid } = require('uuid')

const { scopes } = require('../../../server/permissions')

describe('Upload route', () => {
  const mockCorporatePhoneNumber = '07777111111'
  const mockCorporatePhoneNumberId = uuid()
  const mockPersonalPhoneNumber = '07777222222'
  const mockPersonalPhoneNumberId = uuid()
  const email = 'test@gwa.defra.co.uk'
  const id = uuid()
  const url = '/upload'
  let server

  jest.mock('../../../server/lib/db', () => {
    return {
      getAreaToOfficeMap: jest.fn().mockResolvedValue([
        { areaCode: 'COR', areaName: 'Corporate', officeLocations: [{ officeCode: 'COR:office-one', officeLocation: 'office one' }] },
        { areaCode: 'PER', areaName: 'Personal', officeLocations: [{ officeCode: 'PER:office-one', officeLocation: 'office one' }, { officeCode: 'PER:office-two', officeLocation: 'office two' }] }
      ]),
      getOrganisationList: jest.fn().mockResolvedValue([{ orgCode: 'orgCode', orgName: 'orgName' }]),
      getUsers: jest.fn(),
      getUser: jest.fn()
        .mockResolvedValue({
          active: true,
          phoneNumbers: [
            { id: mockCorporatePhoneNumberId, type: 'corporate', number: mockCorporatePhoneNumber, subscribedTo: ['COR:office-one'] },
            { id: mockPersonalPhoneNumberId, type: 'personal', number: mockPersonalPhoneNumber, subscribedTo: ['PER:office-one', 'PER:office-two'] }
          ]
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ active: false })
        .mockResolvedValueOnce({ active: true, phoneNumbers: [] })
    }
  })

  const createServer = require('../../../server/index')

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('client errors', () => {
    describe('GET requests', () => {
      const method = 'GET'

      test('responds with 302 when no user is logged in - GET', async () => {
        const res = await server.inject({
          method,
          url
        })

        expect(res.statusCode).toEqual(302)
      })

      test('responds with 403 when user does not have sufficient scope', async () => {
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
        expect($('.govuk-body').text()).toEqual('Insufficient scope')
      })
    })

    describe('POST requests', () => {
      const method = 'POST'

      test('responds with 302 when no user is logged in - GET', async () => {
        const res = await server.inject({
          method,
          url
        })

        expect(res.statusCode).toEqual(302)
      })

      test('responds with 403 when user does not have sufficient scope', async () => {
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
        expect($('.govuk-body').text()).toEqual('Insufficient scope')
      })

      test('responds with 200 and errors when no file or orgnisation is included', async () => {
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
              scope: [scopes.data.manage]
            },
            strategy: 'azuread'
          }
        })

        expect(res.statusCode).toEqual(200)
        const $ = cheerio.load(res.payload)

        const errorMessage = $('.govuk-error-summary__list').text()
        expect(errorMessage).toMatch('Select a valid CSV file')
        expect(errorMessage).toMatch('Select an organisation')
      })

      test('responds with 200 and errors when file is not CSV', async () => {
        const form = new FormData()
        form.append('file', Readable.from('data,cols'), { filename: 'test.txt' })
        form.append('orgCode', 'ABC')
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
              scope: [scopes.data.manage]
            },
            strategy: 'azuread'
          },
          headers: form.getHeaders(),
          payload: await getStream(form)
        })

        expect(res.statusCode).toEqual(200)
        const $ = cheerio.load(res.payload)

        const errorMessage = $('.govuk-error-summary__list').text()
        expect(errorMessage).toMatch('Select a valid CSV file')
        expect(errorMessage).not.toMatch('Select an organisation')
      })
    })
  })

  describe('successful requests', () => {
    test('responds with 200 and upload view', async () => {
      const res = await server.inject({
        method: 'GET',
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
            scope: [scopes.data.manage]
          },
          strategy: 'azuread'
        }
      })

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      const heading = $('.govuk-heading-l').text()
      expect(heading).toMatch('Upload')
      expect($('#file')).toHaveLength(1)
      const button = $('.govuk-button')
      expect(button).toHaveLength(1)
      expect(button.text()).toMatch('Upload')
    })

    test.skip('responds with 200 when CSV file is uploaded', async () => {
      const form = new FormData()
      form.append('file', Readable.from('a,b\n1,2'), { filename: 'test.csv' })
      form.append('orgCode', 'ABC')
      const res = await server.inject({
        method: 'POST',
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
            scope: [scopes.data.manage]
          },
          strategy: 'azuread'
        },
        headers: form.getHeaders(),
        payload: await getStream(form)
      })

      expect(res.statusCode).toEqual(200)

      // const $ = cheerio.load(res.payload)
      // const heading = $('.govuk-heading-l').text()
      // expect(heading).toMatch(`Personal phone number: ${mockPersonalPhoneNumber}`)
      // const removeContactButton = $('.govuk-button--danger')
      // expect(removeContactButton).toHaveLength(1)
    })
  })
})
