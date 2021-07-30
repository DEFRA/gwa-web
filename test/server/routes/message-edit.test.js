const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const expectMessageViewOk = require('../../helpers/expect-message-view-ok')
const { errorCases, validCases } = require('../../helpers/message-test-cases')
const { expectNotifyStatus, notifyStatusViewData } = require('../../helpers/notify-status')
const { messageStates } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const addAuditEvent = require('../../../server/lib/messages/add-audit-event')
const { getAreaOfficeCode } = require('../../../server/lib/misc/helpers')

describe('Message edit route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const messageId = uuid()
  const url = `/message-edit/${messageId}`
  let server
  const state = 'created'
  const text = 'some message'
  const info = 'additional info'
  const createTime = new Date('2020-12-31T12:34:56')
  const updateTime = new Date('2021-01-02T08:00:00')
  const createUser = 'creating-things'
  const edituser = 'editing-things'
  const orgCode = 'orgCode'
  const orgCodes = [orgCode]
  const orgName = 'orgName'
  const orgList = [{ orgCode, orgName, active: true, core: true }, { orgCode: 'another', orgName: 'name', active: true, core: true }]
  const areaName = 'areaName'
  const officeLocation = 'officeLocation'
  const officeLocationTwo = 'officeLocationTwo'
  const officeCode = 'ABC:office-code'
  const areaOfficeCode = getAreaOfficeCode({ officeCode })
  const officeLocations = [{ officeCode: 'officeCode', officeLocation }, { officeCode: 'officeCodeTwo', officeLocation: officeLocationTwo }]

  const now = Date.now()
  Date.now = jest.fn(() => now)

  jest.mock('../../../server/lib/db')
  const { getMessage, upsertMessage } = require('../../../server/lib/db')

  const initialMessage = {
    auditEvents: [
      { user: { id: createUser }, type: 'create', time: createTime },
      { user: { id: edituser }, type: 'create', time: updateTime }
    ],
    id: messageId,
    orgCodes,
    officeCodes: [areaOfficeCode],
    state,
    allOffices: true,
    allOrgs: false,
    text,
    info
  }
  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue(orgList)
    server.methods.db.getAreaToOfficeMap = jest.fn().mockResolvedValue([{ areaCode: 'ABC', areaName, officeLocations }])
    getMessage.mockResolvedValue(initialMessage)
    server.methods.getNotifyStatusViewData = jest.fn().mockResolvedValue(notifyStatusViewData)
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('GET request', () => {
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

    test.each([
      { message: undefined, status: 404, error: 'Not Found' },
      { message: { state: 'sent' }, status: 400, error: 'Sent messages can not be edited.' }
    ])('responds with errors when problem with message', async ({ message, status, error }) => {
      getMessage.mockResolvedValueOnce(message)
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

      expect(res.statusCode).toEqual(status)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual(error)
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
      expect($('.govuk-heading-l').text()).toMatch('Edit message')
      expectMessageViewOk($, { areaName, officeLocations, orgList })

      const formGroups = $('.govuk-form-group')
      expect($('textarea', formGroups.eq(0)).text()).toMatch(text)
      expect($('textarea', formGroups.eq(1)).text()).toMatch(info)
      const allOrgsRadio = $('input[name="allOrgs"]:checked')
      expect(allOrgsRadio).toHaveLength(1)
      expect(allOrgsRadio.val()).toEqual('false')
      const orgCheckboxesInput = $('input[name="orgCodes"]:checked')
      expect(orgCheckboxesInput).toHaveLength(1)
      expect(orgCheckboxesInput.val()).toEqual(orgCode)
      const officeCheckboxesChecked = $('input[name="officeCodes"]:checked')
      expect(officeCheckboxesChecked).toHaveLength(1)
      expect(officeCheckboxesChecked.val()).toEqual(areaOfficeCode)
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
      const payload = { allOffices: true, allOrgs: false, orgCodes: ['orgCode', 'another'], text: 'message to send' }
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

    test.each([
      { messageId: undefined, message: undefined, status: 404, error: 'Not Found' },
      { messageId: 'unique', message: { state: 'sent' }, status: 400, error: 'Sent messages can not be edited.' }
    ])('responds with errors when problem with message', async ({ messageId, message, status, error }) => {
      const payload = { messageId, allOffices: true, allOrgs: false, orgCodes: ['orgCode', 'another'], text: 'message to send' }
      getMessage.mockResolvedValueOnce(message)
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

      expect(res.statusCode).toEqual(status)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual(error)
    })

    test.each(validCases)('responds with 302 to /message-view when request is valid - test %#', async (payload) => {
      upsertMessage.mockResolvedValue({ statusCode: 200 })
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
      expect(res.headers.location).toEqual(`/message-view/${messageId}`)

      const expectedMessage = {
        ...initialMessage,
        allOffices: payload.allOffices,
        id: messageId,
        info: payload.info?.trim(),
        officeCodes: [payload.officeCodes ?? []].flat(),
        orgCodes: [payload.orgCodes].flat(),
        text: payload.text?.trim(),
        state: messageStates.edited
      }
      addAuditEvent(expectedMessage, user)
      expect(upsertMessage).toHaveBeenCalledWith(expectedMessage)
    })
  })
})
