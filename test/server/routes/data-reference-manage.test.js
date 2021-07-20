const cheerio = require('cheerio')
const FormData = require('form-data')
const getStream = require('get-stream')
const { Readable } = require('stream')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { typeInfo, types } = require('../../../server/lib/view/reference-data')

describe('Data reference manage route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const baseUrl = '/data-reference-manage'
  let server

  jest.mock('../../../server/lib/data/update-reference-data')
  const updateReferenceData = require('../../../server/lib/data/update-reference-data')

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

  describe('GET requests', () => {
    const method = 'GET'

    test.each(routes)('responds with 302 when no user is logged in', async ({ type }) => {
      const res = await server.inject({
        method,
        url: `${baseUrl}/${type}`
      })

      expect(res.statusCode).toEqual(302)
    })

    test.each(routes)('responds with 403 when user does not have sufficient scope', async ({ type }) => {
      const res = await server.inject({
        method,
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
        method,
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

  describe('POST requests', () => {
    const method = 'POST'
    const orgCode = 'orgCode'
    const input = {
      [types.officeLocations]: 'originalOfficeLocation,officeLocation,areaCode,areaName,officeCode',
      [types.orgList]: `orgName,${orgCode},TRUE,FALSE`,
      [types.orgMap]: `originalOrgName,orgName,${orgCode}`
    }

    function mockServerMethods (type) {
      switch (type) {
        case types.officeLocations:
          server.methods.db.getAreaToOfficeMap.cache.drop = jest.fn()
          server.methods.db.getStandardisedOfficeLocationMap.cache.drop = jest.fn()
          break
        case types.orgList:
          server.methods.db.getOrganisationList.cache.drop = jest.fn()
          break
        case types.orgMap:
          server.methods.db.getOrganisationList = jest.fn().mockResolvedValue([{ orgCode, orgName: 'orgName', active: true, core: true }])
          break
      }
    }

    test.each(routes)('responds with 302 when no user is logged in - GET', async ({ type }) => {
      const res = await server.inject({
        method,
        url: `${baseUrl}/${type}`
      })

      expect(res.statusCode).toEqual(302)
    })

    test.each(routes)('responds with 403 when user does not have sufficient scope', async ({ type }) => {
      const res = await server.inject({
        method,
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

    test.each(routes)('responds with 400 when no file', async ({ type }) => {
      const res = await server.inject({
        method,
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

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toEqual(400)

      const errorText = $('.govuk-grid-column-two-thirds').text()
      expect(errorText).toMatch('400 - Bad Request')
      expect(errorText).toMatch('Invalid request payload input')
    })

    test.each(routes)('responds with 200 and errors when filename does not end with csv', async ({ type }) => {
      const form = new FormData()
      form.append('file', Readable.from('data,cols'), { filename: 'csv.not' })
      const res = await server.inject({
        method,
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
        },
        headers: form.getHeaders(),
        payload: await getStream(form)
      })

      expect(res.statusCode).toEqual(200)
      const $ = cheerio.load(res.payload)

      const errorMessage = $('.govuk-error-summary__list').text()
      expect(errorMessage).toMatch('Select a valid CSV file')
    })

    test.each(routes)('responds with 200 and errors when file is not validated correctly - %o', async ({ type }) => {
      server.methods.db.getOrganisationList = jest.fn().mockResolvedValue([{ orgCode: 'orgCode', orgName: 'orgName', active: true, core: true }])
      const form = new FormData()
      form.append('file', Readable.from('data,cols'), { filename: 'test.csv' })
      const res = await server.inject({
        method,
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
        },
        headers: form.getHeaders(),
        payload: await getStream(form)
      })

      expect(res.statusCode).toEqual(200)
      const $ = cheerio.load(res.payload)

      const errorMessage = $('.govuk-error-summary__list').text()
      expect(errorMessage).toMatch('Reference data was not valid.')
    })

    test.each(routes)('responds with 200 when CSV file is uploaded - %o', async ({ type }) => {
      mockServerMethods(type, { orgCode })
      updateReferenceData.mockResolvedValue({ statusCode: 200 })
      const filename = `${type}.csv`
      const form = new FormData()
      form.append('file', Readable.from(`${typeInfo[type].headers.join()}\n${input[type]}`), { filename })
      const res = await server.inject({
        method,
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
        },
        headers: form.getHeaders(),
        payload: await getStream(form)
      })

      expect(res.statusCode).toEqual(200)
      const $ = cheerio.load(res.payload)

      expect($('.govuk-heading-l').text()).toMatch('Reference data upload succeeded')
      expect($('.govuk-body').text()).toMatch(`The reference data for ${typeInfo[type].heading} was successfully updated with the data from ${filename}.`)
    })

    test.each(routes)('responds with 500 when update for reference data is not 200 - %o', async ({ type }) => {
      mockServerMethods(type, { orgCode })
      updateReferenceData.mockResolvedValue({ statusCode: 500 })
      const filename = `${type}.csv`
      const form = new FormData()
      form.append('file', Readable.from(`${typeInfo[type].headers.join()}\n${input[type]}`), { filename })
      const res = await server.inject({
        method,
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
        },
        headers: form.getHeaders(),
        payload: await getStream(form)
      })

      expect(res.statusCode).toEqual(500)
      const $ = cheerio.load(res.payload)

      expect($('.govuk-grid-column-two-thirds').text()).toMatch('Sorry, there is a problem with the service')
    })

    test.each(routes)('responds with 500 when error occurs - %o', async ({ type }) => {
      mockServerMethods(type, { orgCode })
      updateReferenceData.mockRejectedValue(new Error('busted'))
      const filename = `${type}.csv`
      const form = new FormData()
      form.append('file', Readable.from(`${typeInfo[type].headers.join()}\n${input[type]}`), { filename })
      const res = await server.inject({
        method,
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
        },
        headers: form.getHeaders(),
        payload: await getStream(form)
      })

      expect(res.statusCode).toEqual(500)
      const $ = cheerio.load(res.payload)

      expect($('.govuk-grid-column-two-thirds').text()).toMatch('Sorry, there is a problem with the service')
    })
  })
})
