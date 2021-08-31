const cheerio = require('cheerio')
const { uuidRegex, uuidRegexEnd } = require('../../helpers/constants')
const expectMessageViewOk = require('../../helpers/expect-message-view-ok')
const { errorCases, validCases } = require('../../helpers/message-test-cases')
const { expectNotifyStatus, notifyStatusViewData } = require('../../helpers/notify-status')
const { messageStates } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const addAuditEvent = require('../../../server/lib/messages/add-audit-event')

describe('Message creation route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const orgCode = 'orgCode'
  const orgName = 'orgName'
  const url = '/message-create'
  let server
  const orgList = [{ orgCode, orgName, active: true, core: true }, { orgCode: 'another', orgName: 'name', active: true, core: true }]
  const areaName = 'areaName'
  const officeLocation = 'officeLocation'
  const officeLocationTwo = 'officeLocationTwo'
  const officeLocations = [{ officeCode: 'officeCode', officeLocation }, { officeCode: 'officeCodeTwo', officeLocation: officeLocationTwo }]

  const now = Date.now()
  Date.now = jest.fn(() => now)

  jest.mock('../../../server/lib/db')
  const { upsertMessage } = require('../../../server/lib/db')

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue(orgList)
    server.methods.db.getAreaToOfficeMap = jest.fn().mockResolvedValue([{ areaCode: 'ABC', areaName, officeLocations }])
    server.methods.getNotifyStatusViewData = jest.fn().mockResolvedValue(notifyStatusViewData)
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

    test('responds with 200 when user has sufficient scope', async () => {
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
            scope: [scopes.message.manage]
          },
          strategy: 'azuread'
        }
      })

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('Create message')
      expectMessageViewOk($, { areaName, officeLocations, orgList })
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

    test.each(errorCases)('responds with 200 and errors when request is invalid - test %#', async (payload, error) => {
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
            scope: [scopes.message.manage]
          },
          strategy: 'azuread'
        },
        payload
      })

      expect(res.statusCode).toEqual(200)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-error-summary__title').text()).toMatch('There is a problem')
      expect($('.govuk-error-summary__body').text()).toMatch(error)

      expectNotifyStatus($)
    })

    test('responds with 500 when problem creating message', async () => {
      const payload = { allOffices: true, orgCodes: ['orgCode', 'another'], text: 'message to send' }
      upsertMessage.mockResolvedValue({ statusCode: 500 })
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
            scope: [scopes.message.manage]
          },
          strategy: 'azuread'
        },
        payload
      })

      expect(res.statusCode).toEqual(500)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-grid-column-two-thirds').text()).toMatch('Sorry, there is a problem with the service')
    })

    test.each(validCases)('responds with 302 to /message-view of created message when request is valid - test %#', async (payload) => {
      upsertMessage.mockResolvedValue({ statusCode: 201 })
      const user = { id, email, companyName: 'companyName', surname: 'surname', givenName: 'givenName' }
      const res = await server.inject({
        method,
        url,
        auth: {
          credentials: {
            user: {
              ...user,
              displayName: 'test gwa',
              raw: {
                roles: JSON.stringify([])
              }
            },
            scope: [scopes.message.manage]
          },
          strategy: 'azuread'
        },
        payload
      })

      expect(res.statusCode).toEqual(302)
      expect(res.headers.location).toMatch('/message-view/')
      expect(res.headers.location).toMatch(uuidRegexEnd)

      const expectedMessage = {
        allOffices: payload.allOffices,
        id: expect.stringMatching(uuidRegex),
        info: payload.info?.trim(),
        officeCodes: [payload.officeCodes ?? []].flat(),
        orgCodes: [payload.orgCodes].flat(),
        text: payload.text?.trim(),
        state: messageStates.created
      }
      addAuditEvent(expectedMessage, user)
      expect(upsertMessage).toHaveBeenCalledWith(expectedMessage)
    })
  })
})
