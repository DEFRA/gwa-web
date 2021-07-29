const cheerio = require('cheerio')
const { navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Org data download route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const baseUrl = '/org-data-'
  const orgCode = 'orgCode'
  const orgName = 'orgName'
  let server

  jest.mock('../../../server/lib/data/download-org-data')
  const downloadOrgData = require('../../../server/lib/data/download-org-data')
  jest.mock('../../../server/lib/data/convert-users-json-to-csv')
  const convertUsersJSONToCSV = require('../../../server/lib/data/convert-users-json-to-csv')
  jest.mock('../../../server/lib/data/delete-org-data')
  const deleteOrgData = require('../../../server/lib/data/delete-org-data')

  beforeEach(async () => {
    server = await createServer()
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue([{ orgCode, orgName, active: true, core: false }])
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('GET requests', () => {
    const method = 'GET'

    test.each([
      { section: 'delete' },
      { section: 'download' }
    ])('responds with 302 when no user is logged in', async ({ section }) => {
      const res = await server.inject({
        method,
        url: `${baseUrl}${section}`
      })

      expect(res.statusCode).toEqual(302)
    })

    test.each([
      { section: 'delete' },
      { section: 'download' }
    ])('responds with 403 when user does not have sufficient scope', async ({ section }) => {
      const res = await server.inject({
        method,
        url: `${baseUrl}${section}`,
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

    test('responds with 400 when section is not valid', async () => {
      const res = await server.inject({
        method,
        url: `${baseUrl}not-valid`,
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

      expect(res.statusCode).toEqual(400)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Invalid request params input')
    })

    test.each([
      { section: 'delete', word: 'Delete' },
      { section: 'download', word: 'Download' }
    ])('responds with 200 when user has sufficient scope and request is successful', async ({ section, word }) => {
      const res = await server.inject({
        method,
        url: `${baseUrl}${section}`,
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
      expect($('.govuk-heading-l').text()).toMatch(`${word} users for an ALB`)
      expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.data.text)
      expect($('.govuk-phase-banner')).toHaveLength(0)
      const select = $('#orgCode')
      expect(select).toHaveLength(1)
      const options = $('option', select)
      expect(options).toHaveLength(2)
      expect(options.eq(0).attr('selected')).toBeDefined()
      expect(options.eq(0).attr('value')).toEqual('')
      expect(options.eq(0).text()).toEqual('Select an organisation')
      expect(options.eq(1).attr('selected')).toBeUndefined()
      expect(options.eq(1).attr('value')).toEqual(orgCode)
      expect(options.eq(1).text()).toEqual(orgName)
      const buttons = $('.govuk-button')
      expect(buttons).toHaveLength(2)
      expect(buttons.eq(0).text()).toMatch('Cancel')
      expect(buttons.eq(0).attr('href')).toMatch('/org-data')
      expect(buttons.eq(1).text()).toMatch(word)
    })
  })

  describe('POST requests', () => {
    const method = 'POST'

    test.each([
      { section: 'delete' },
      { section: 'download' }
    ])('responds with 302 when no user is logged in', async ({ section }) => {
      const res = await server.inject({
        method,
        url: `${baseUrl}${section}`
      })

      expect(res.statusCode).toEqual(302)
    })

    test.each([
      { section: 'delete' },
      { section: 'download' }
    ])('responds with 403 when user does not have sufficient scope', async ({ section }) => {
      const res = await server.inject({
        method,
        url: `${baseUrl}${section}`,
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

    test('responds with 400 when section is not valid', async () => {
      const res = await server.inject({
        method,
        url: `${baseUrl}not-valid`,
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

      expect(res.statusCode).toEqual(400)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Invalid request params input')
    })

    test.each([
      { payload: {}, errorMessage: 'Select an organisation' },
      { payload: { orgCode }, errorMessage: 'No file exists for the selected organisation' }
    ])('responds with 200 and errors when no organisation is selected or file is not available - download', async ({ payload, errorMessage }) => {
      downloadOrgData.mockResolvedValue(undefined)

      const res = await server.inject({
        method,
        url: `${baseUrl}download`,
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
        payload
      })

      expect(res.statusCode).toEqual(200)
      const $ = cheerio.load(res.payload)

      const errorList = $('.govuk-error-summary__list').text()
      expect(errorList).toMatch(errorMessage)
    })

    test.each([
      { payload: {}, errorMessage: 'Select an organisation' },
      { payload: { orgCode }, errorMessage: 'No file exists for the selected organisation' }
    ])('responds with 200 and errors when no organisation is selected or file is not available - delete', async ({ payload, errorMessage }) => {
      deleteOrgData.mockResolvedValue(false)

      const res = await server.inject({
        method,
        url: `${baseUrl}delete`,
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
        payload
      })

      expect(res.statusCode).toEqual(200)
      const $ = cheerio.load(res.payload)

      const errorList = $('.govuk-error-summary__list').text()
      expect(errorList).toMatch(errorMessage)
    })

    test('responds with 200 and file contents when file is available - download', async () => {
      const email = 'a@b.com'
      const givenName = 'givenName'
      const phoneNumbers = ['+447700111222']
      const user = { email, givenName, phoneNumbers }
      downloadOrgData.mockResolvedValue(JSON.stringify(user))
      const csvData = `email,givenName,phoneNumbers\n${email},${givenName},${phoneNumbers[0]}`
      convertUsersJSONToCSV.mockResolvedValue(csvData)

      const res = await server.inject({
        method,
        url: `${baseUrl}download`,
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
        payload: { orgCode }
      })

      expect(res.statusCode).toEqual(200)
      expect(res.headers).toHaveProperty('content-type')
      expect(res.headers['content-type']).toEqual('text/csv; charset=utf-8')
      expect(res.headers['content-disposition']).toEqual(`attachment; filename=${orgCode}.csv`)
      expect(res.result).toEqual(csvData)
    })

    test('responds with 302 redirect to /org-data when file was successfully deleted', async () => {
      deleteOrgData.mockResolvedValue(true)

      const res = await server.inject({
        method,
        url: `${baseUrl}delete`,
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
        payload: { orgCode }
      })

      expect(res.statusCode).toEqual(302)
      expect(res.headers.location).toEqual('/org-data')
    })
  })
})
