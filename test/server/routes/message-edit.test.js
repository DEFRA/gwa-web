const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const { textMessages: { maxInfoLength, maxMessageLength } } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { message } = require('../../../server/lib/error-messages')
const { getAreaOfficeCode } = require('../../../server/lib/helpers')

describe('Message edit route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = `/message-edit/${uuid()}`
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

  jest.mock('../../../server/lib/db')
  const { getMessage, updateMessage } = require('../../../server/lib/db')

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue(orgList)
    server.methods.db.getAreaToOfficeMap = jest.fn().mockResolvedValue([{ areaCode: 'ABC', areaName, officeLocations: [{ officeCode, officeLocation }, { officeCode: 'officeCodeTwo', officeLocation: officeLocationTwo }] }])
    getMessage.mockResolvedValue({
      auditEvents: [
        { user: { id: createUser }, type: 'create', time: createTime },
        { user: { id: edituser }, type: 'create', time: updateTime }
      ],
      orgCodes,
      officeCodes: [areaOfficeCode],
      state,
      allOffices: true,
      text,
      info
    })
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
      { message: { state: 'sent' }, status: 401, error: 'Sent messages can not be edited.' }
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
      const formGroups = $('.govuk-form-group')
      expect(formGroups).toHaveLength(7)
      expect($('label', formGroups.eq(0)).text()).toMatch('Text message')
      expect($('textarea', formGroups.eq(0)).text()).toMatch(text)
      expect($('.govuk-hint', formGroups.eq(0)).text()).toMatch('Enter the message you wish to send.')
      expect($('label', formGroups.eq(1)).text()).toMatch('Additional information')
      expect($('textarea', formGroups.eq(1)).text()).toMatch(info)
      expect($('.govuk-hint', formGroups.eq(1)).text()).toMatch('Use this as an aide memoire relating to the message. It is optional, feel free to leave empty.')
      expect($('legend', formGroups.eq(2)).text()).toMatch('Which organisations should the message be sent to?')
      const orgCheckboxesInput = $('input[name="orgCodes"]:checked')
      expect(orgCheckboxesInput).toHaveLength(1)
      expect(orgCheckboxesInput.val()).toEqual(orgCode)
      expect($('#officeCodes', formGroups.eq(3)).text()).toMatch('Which office locations should the message be sent to?')
      expect($('#allOffices').val()).toEqual('true')
      expect($('legend', formGroups.eq(4)).text()).toMatch('Do you want to send the message to all office locations')
      expect($('.govuk-checkboxes__item', formGroups.eq(2))).toHaveLength(orgList.length)
      expect($('.govuk-accordion__section')).toHaveLength(1)
      expect($('.govuk-accordion__section-header').eq(0).text()).toMatch(areaName)
      const officeCheckboxes = $('.govuk-accordion__section-content .govuk-checkboxes__item')
      expect(officeCheckboxes).toHaveLength(1)
      expect(officeCheckboxes.eq(0).text()).toMatch(`All office locations in the ${areaName} area`)
      const officeCheckboxesChecked = $('input[name="officeCodes"]:checked')
      expect(officeCheckboxesChecked).toHaveLength(1)
      expect(officeCheckboxesChecked.val()).toEqual(areaOfficeCode)
      const officeListItems = $('.govuk-list.govuk-list--bullet li')
      expect(officeListItems).toHaveLength(2)
      expect(officeListItems.eq(0).text()).toMatch(officeLocation)
      expect(officeListItems.eq(1).text()).toMatch(officeLocationTwo)
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

    test.each([
      [{ officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, message.allOffices],
      [{ officeCodes: 'ABC:one', orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, message.allOffices],
      [{ allOffices: true, orgCodes: ['orgCode'], text: 'message to send', info: 'a'.repeat(maxInfoLength + 1) }, message.info],
      [{ allOffices: true, orgCodes: ['orgCode'], text: 'a'.repeat(maxMessageLength + 1) }, message.text],
      [{ allOffices: false, officeCodes: [], orgCodes: ['orgCode', 'another'], text: 'message to send', info: 'valid' }, message.officeCodes],
      [{ allOffices: false, officeCodes: [], orgCodes: 'orgCode', text: 'message to send', info: 'valid' }, message.officeCodes],
      [{ allOffices: false, officeCodes: ['ABC:one'], orgCodes: [], text: 'message to send', info: 'valid' }, message.orgCodes]
    ])('responds with 200 and errors when request is invalid - ', async (payload, error) => {
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
    })

    test('responds with 500 when problem creating message', async () => {
      const payload = { allOffices: true, orgCodes: ['orgCode', 'another'], text: 'message to send' }
      updateMessage.mockResolvedValue({ statusCode: 500 })
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
      { messageId: 'unique', message: { state: 'sent' }, status: 401, error: 'Sent messages can not be edited.' }
    ])('responds with errors when problem with message', async ({ messageId, message, status, error }) => {
      const payload = { messageId, allOffices: true, orgCodes: ['orgCode', 'another'], text: 'message to send' }
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

    test.each([
      [{ allOffices: false, officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }],
      [{ allOffices: false, officeCodes: 'ABC:one', orgCodes: 'orgCode', text: 'message to send', info: 'valid' }],
      [{ allOffices: true, orgCodes: ['orgCode', 'another'], text: 'message to send' }],
      [{ allOffices: true, orgCodes: ['orgCode'], text: 'a'.repeat(maxMessageLength), info: 'a'.repeat(maxInfoLength) }]
    ])('responds with 302 to /messages when request is valid - test %#', async (payload) => {
      updateMessage.mockResolvedValue({ statusCode: 200 })
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

      expect(res.statusCode).toEqual(302)
      expect(res.headers.location).toEqual('/messages')
    })
  })
})
