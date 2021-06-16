const { Readable } = require('stream')

const cheerio = require('cheerio')
const FormData = require('form-data')
const getStream = require('get-stream')
const { v4: uuid } = require('uuid')

const { scopes } = require('../../../server/permissions')
const { headers } = require('../../../server/constants')

describe('Upload route', () => {
  const mockCorporatePhoneNumber = '07777111111'
  const mockCorporatePhoneNumberId = uuid()
  const mockPersonalPhoneNumber = '07777222222'
  const mockPersonalPhoneNumberId = uuid()
  const email = 'test@gwa.defra.co.uk'
  const id = uuid()
  const url = '/upload'
  const orgCode = 'orgCode'
  const orgName = 'orgName'
  const originalOfficeLocation = 'originalOfficeLocation'
  const officeCode = 'ABC:alphabet-office'
  const officeLocation = 'Alphabet office'
  let server

  jest.mock('../../../server/lib/upload-user-data')
  const uploadUserData = require('../../../server/lib/upload-user-data')
  jest.mock('../../../server/lib/db', () => {
    return {
      getAreaToOfficeMap: jest.fn().mockResolvedValue([
        { areaCode: 'COR', areaName: 'Corporate', officeLocations: [{ officeCode: 'COR:office-one', officeLocation: 'office one' }] },
        { areaCode: 'PER', areaName: 'Personal', officeLocations: [{ officeCode: 'PER:office-one', officeLocation: 'office one' }, { officeCode: 'PER:office-two', officeLocation: 'office two' }] }
      ]),
      getOrganisationList: jest.fn().mockResolvedValue([{ orgCode, orgName }]),
      getStandardisedOfficeLocationMap: jest.fn().mockResolvedValue([{ originalOfficeLocation, officeCode, officeLocation }]),
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

      test('responds with 200 and errors when file contains errors', async () => {
        const filename = 'test.csv'
        const userCount = 2
        const form = new FormData()
        form.append('file', Readable.from('a,b\n1,2\n3,4'), { filename })
        form.append('orgCode', orgCode)
        const res = await server.inject({
          method: 'POST',
          url,
          auth: {
            credentials: {
              user: {
                id,
                email,
                displayName: 'test gwa',
                officeCode,
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
        expect($('.govuk-heading-l').text()).toEqual('Upload')
        expect($('.govuk-error-summary__list').text()).toMatch(`${userCount} record(s) are not valid.`)
      })

      test('responds with 200 and errors when file contains no users', async () => {
        const filename = 'test.csv'
        const form = new FormData()
        form.append('file', Readable.from(`${headers.join(',')}\n`), { filename })
        form.append('orgCode', orgCode)
        const res = await server.inject({
          method: 'POST',
          url,
          auth: {
            credentials: {
              user: {
                id,
                email,
                displayName: 'test gwa',
                officeCode,
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
        expect($('.govuk-heading-l').text()).toEqual('Upload')
        expect($('.govuk-error-summary__list').text()).toMatch('No valid records found. No upload will take place.')
      })

      test('responds with 200 and errors when file contains no valid users', async () => {
        const filename = 'test.csv'
        const userCount = 1
        const form = new FormData()
        form.append('file', Readable.from(`${headers.join(',')}\nabc@test.com,givenName,surname,home office,07000111111`), { filename })
        form.append('orgCode', orgCode)
        const res = await server.inject({
          method: 'POST',
          url,
          auth: {
            credentials: {
              user: {
                id,
                email,
                displayName: 'test gwa',
                officeCode,
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
        expect($('.govuk-heading-l').text()).toEqual('Upload')
        expect($('.govuk-error-summary__list').text()).toMatch(`${userCount} record(s) are not valid.`)
      })

      test('responds with 200 and errors when file contains some valid users and some non-valid users', async () => {
        const filename = 'test.csv'
        const userCount = 1
        const form = new FormData()
        form.append('file', Readable.from(`${headers.join(',')}\nabc@test.com,givenName,surname,home office,07700111111\nxyz@test.com,givenName,surname,home office,07000111111`), { filename })
        form.append('orgCode', orgCode)
        const res = await server.inject({
          method: 'POST',
          url,
          auth: {
            credentials: {
              user: {
                id,
                email,
                displayName: 'test gwa',
                officeCode,
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
        expect($('.govuk-heading-l').text()).toEqual('Upload')
        expect($('.govuk-error-summary__list').text()).toMatch(`${userCount} record(s) are not valid.`)
      })

      test('responds with 500 when upload response was not successful', async () => {
        uploadUserData.mockResolvedValue(false)
        const filename = 'test.csv'
        const form = new FormData()
        form.append('file', Readable.from(`${headers.join(',')}\nabc@test.com,givenName,surname,home office,07700111111`), { filename })
        form.append('orgCode', orgCode)
        const res = await server.inject({
          method: 'POST',
          url,
          auth: {
            credentials: {
              user: {
                id,
                email,
                displayName: 'test gwa',
                officeCode,
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

        expect(res.statusCode).toEqual(500)

        const $ = cheerio.load(res.payload)
        expect($('.govuk-body').text()).toEqual('Please try again later.')
      })

      test('responds with 500 when problem during file upload', async () => {
        uploadUserData.mockRejectedValue(new Error('Upload error'))
        const filename = 'test.csv'
        const form = new FormData()
        form.append('file', Readable.from(`${headers.join(',')}\nabc@test.com,givenName,surname,home office,07700111111`), { filename })
        form.append('orgCode', orgCode)
        const res = await server.inject({
          method: 'POST',
          url,
          auth: {
            credentials: {
              user: {
                id,
                email,
                displayName: 'test gwa',
                officeCode,
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

        expect(res.statusCode).toEqual(500)

        const $ = cheerio.load(res.payload)
        expect($('.govuk-body').text()).toEqual('Please try again later.')
      })

      test('responds with 400 and errors when org is not recognised', async () => {
        const filename = 'test.csv'
        const notValidOrgCode = 'not-valid-org-code'
        const form = new FormData()
        form.append('file', Readable.from(`${headers.join(',')}\nabc@test.com,givenName,surname,home office,07700111111`), { filename })
        form.append('orgCode', notValidOrgCode)
        const res = await server.inject({
          method: 'POST',
          url,
          auth: {
            credentials: {
              user: {
                id,
                email,
                displayName: 'test gwa',
                officeCode,
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

        expect(res.statusCode).toEqual(400)

        const $ = cheerio.load(res.payload)
        expect($('.govuk-body').text()).toEqual(`Organisation with code ${notValidOrgCode} not recognised.`)
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
      expect($('.govuk-heading-l').text()).toMatch('Upload')
      expect($('#file')).toHaveLength(1)
      expect($('.govuk-body').text()).toMatch('The file must contain a header row. The following columns are required (in this order): emailAddress, givenName, surname, officeLocation, phoneNumber.')
      const button = $('.govuk-button')
      expect(button).toHaveLength(1)
      expect(button.text()).toMatch('Upload')
    })

    test('responds with 200 when CSV file is uploaded', async () => {
      uploadUserData.mockResolvedValue(true)
      const filename = 'test.csv'
      const userCount = 1
      const form = new FormData()
      form.append('file', Readable.from(`${headers.join(',')}\nabc@test.com,givenName,surname,home office,07700111111`), { filename })
      form.append('orgCode', orgCode)
      const res = await server.inject({
        method: 'POST',
        url,
        auth: {
          credentials: {
            user: {
              id,
              email,
              displayName: 'test gwa',
              officeCode,
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
      expect($('.govuk-heading-l').text()).toEqual('Upload succeeded')
      expect($('.govuk-body').text()).toMatch(`${filename} was successfully uploaded.${userCount} user(s) were uploaded and associated to ${orgName}.`)
    })
  })
})
