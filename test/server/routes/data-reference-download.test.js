const cheerio = require('cheerio')
const csvtojson = require('csvtojson')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { types } = require('../../../server/lib/view/reference-data')

describe('Data reference download route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const baseUrl = '/data-reference-download'
  let server

  const orgCode = 'orgCode'
  const orgName = 'orgName'
  const originalOfficeLocation = 'originalOfficeLocation'
  const officeCode = 'ABC:alphabet-office'
  const officeLocation = 'Alphabet office'
  jest.mock('../../../server/lib/db', () => {
    return {
      getOrganisationMap: jest.fn().mockResolvedValue([{ originalOfficeLocation: 'originalOfficeLocation', officeLocation: 'officeLocation', areaCode: 'areaCode', areaName: 'areaName', officeCode: 'officeCode' }])
    }
  })

  const officeLocationMapDropMock = jest.fn()
  const organisationListDropMock = jest.fn()
  beforeAll(async () => {
    server = await createServer()
    server.methods.db.getStandardisedOfficeLocationMap = jest.fn().mockResolvedValue([{ originalOfficeLocation, officeCode, officeLocation }])
    server.methods.db.getStandardisedOfficeLocationMap.cache = { drop: officeLocationMapDropMock }
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue([{ orgCode, orgName, active: true, core: true }])
    server.methods.db.getOrganisationList.cache = { drop: organisationListDropMock }
  })

  afterAll(async () => {
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
    expect(res.headers).toHaveProperty('content-type')
    expect(res.headers['content-type']).toEqual('text/csv; charset=utf-8')

    const items = await csvtojson().fromString(res.payload)
    expect(items).toHaveLength(1)
    const data = items[0]

    switch (type) {
      case types.officeLocations:
        expect(officeLocationMapDropMock).toHaveBeenCalled()
        expect(data).toHaveProperty('originalOfficeLocation')
        expect(data).toHaveProperty('officeCode')
        expect(data).toHaveProperty('officeLocation')
        break
      case types.orgList:
        expect(organisationListDropMock).toHaveBeenCalled()
        expect(data).toHaveProperty('orgCode')
        expect(data).toHaveProperty('orgName')
        expect(data).toHaveProperty('active')
        expect(data).toHaveProperty('core')
        break
      case types.orgMap:
        expect(data).toHaveProperty('originalOfficeLocation')
        expect(data).toHaveProperty('officeLocation')
        expect(data).toHaveProperty('areaCode')
        expect(data).toHaveProperty('areaName')
        expect(data).toHaveProperty('officeCode')
        break
    }
  })
})
