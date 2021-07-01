const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { textMessages: { maxInfoLength, maxMessageLength } } = require('../../../server/constants')
const { message } = require('../../../server/lib/error-messages')

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

  jest.mock('../../../server/lib/db')
  const { saveMessage } = require('../../../server/lib/db')

  beforeEach(async () => {
    server = await createServer()
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue(orgList)
    server.methods.db.getAreaToOfficeMap = jest.fn().mockResolvedValue([{ areaCode: 'ABC', areaName, officeLocations: [{ officeCode: 'officeCode', officeLocation }, { officeCode: 'officeCodeTwo', officeLocation: officeLocationTwo }] }])
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
      const title = $('.govuk-heading-l').text()
      expect(title).toMatch('Create message')
      const formGroups = $('.govuk-form-group')
      expect(formGroups).toHaveLength(6)
      expect($('label', formGroups.eq(0)).text()).toMatch('Text message')
      expect($('.govuk-hint', formGroups.eq(0)).text()).toMatch('Enter the message you wish to send.')
      expect($('label', formGroups.eq(1)).text()).toMatch('Additional information')
      expect($('.govuk-hint', formGroups.eq(1)).text()).toMatch('Use this as an aide memoire relating to the message. It is optional, feel free to leave empty.')
      expect($('legend', formGroups.eq(2)).text()).toMatch('Which organisations should the message be sent to?')
      expect($('#officeCodes', formGroups.eq(3)).text()).toMatch('Which office locations should the message be sent to?')
      expect($('legend', formGroups.eq(4)).text()).toMatch('Do you want to send the message to all office locations')
      expect($('.govuk-checkboxes__item', formGroups.eq(2))).toHaveLength(orgList.length)
      expect($('.govuk-accordion__section')).toHaveLength(1)
      expect($('.govuk-accordion__section-header').eq(0).text()).toMatch(areaName)
      const checkboxes = $('.govuk-accordion__section-content .govuk-checkboxes__item')
      expect(checkboxes).toHaveLength(3)
      expect(checkboxes.eq(0).text()).toMatch(`All office locations in the ${areaName} area`)
      expect(checkboxes.eq(1).text()).toMatch(officeLocation)
      expect(checkboxes.eq(2).text()).toMatch(officeLocationTwo)
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
      saveMessage.mockResolvedValue({ statusCode: 201 })
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
      saveMessage.mockResolvedValue({ statusCode: 500 })
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
      [{ allOffices: false, officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }],
      [{ allOffices: false, officeCodes: 'ABC:one', orgCodes: 'orgCode', text: 'message to send', info: 'valid' }],
      [{ allOffices: true, orgCodes: ['orgCode', 'another'], text: 'message to send' }],
      [{ allOffices: true, orgCodes: ['orgCode'], text: 'a'.repeat(maxMessageLength), info: 'a'.repeat(maxInfoLength) }]
    ])('responds with 302 to /messages when request is valid - test %#', async (payload) => {
      saveMessage.mockResolvedValue({ statusCode: 201 })
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
