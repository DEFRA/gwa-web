const cheerio = require('cheerio')
const { errorMessages, textMessages: { maxInfoLength, maxMessageLength }, navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

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
  const notifyStatusViewData = {
    service: {
      description: 'All Systems Go!',
      tag: 'govuk-tag--green'
    },
    componentRows: [[
      { text: 'component name' },
      { html: '<strong class="govuk-tag govuk-tag--green">operational</strong>' }
    ]],
    lastChecked: Date.now()
  }

  jest.mock('../../../server/lib/db')
  const { saveMessage } = require('../../../server/lib/db')

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    server.methods.db.getOrganisationList = jest.fn().mockResolvedValue(orgList)
    server.methods.db.getAreaToOfficeMap = jest.fn().mockResolvedValue([{ areaCode: 'ABC', areaName, officeLocations: [{ officeCode: 'officeCode', officeLocation }, { officeCode: 'officeCodeTwo', officeLocation: officeLocationTwo }] }])
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
      expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.messages.text)
      const title = $('.govuk-heading-l').text()
      expect(title).toMatch('Create message')
      const formGroups = $('.govuk-form-group')
      expect(formGroups).toHaveLength(7)
      expect($('label', formGroups.eq(0)).text()).toMatch('Message text')
      expect($('.govuk-hint', formGroups.eq(0)).text()).toMatch('Enter the message to send.')
      expect($('label', formGroups.eq(1)).text()).toMatch('Additional information')
      expect($('.govuk-hint', formGroups.eq(1)).text()).toMatch('Enter any useful additional information.')
      expect($('legend', formGroups.eq(2)).text()).toMatch('Which organisations should the message be sent to?')
      const helpDetails = $('.govuk-details')
      expect(helpDetails).toHaveLength(2)
      expect($('.govuk-details__summary-text', helpDetails.eq(0)).text()).toMatch('Help with message content')
      expect($('.govuk-details__text', helpDetails.eq(0)).text()).toMatch('This is some additional guidance about the type of content to be sent for a message.')
      expect($('.govuk-details__summary-text', helpDetails.eq(1)).text()).toMatch('Help with additional information content')
      expect($('.govuk-details__text', helpDetails.eq(1)).text()).toMatch('The information entered here is only seen by administrators of this service. It might be useful to enter some notes as to what the message was for or when it needs to be sent.Use this as an aide memoire relating to the message. It is optional, feel free to leave empty.')

      expect($('#officeCodes', formGroups.eq(3)).text()).toMatch('Which office locations should the message be sent to?')
      expect($('legend', formGroups.eq(4)).text()).toMatch('Do you want to send the message to all office locations')
      expect($('.govuk-checkboxes__item', formGroups.eq(2))).toHaveLength(orgList.length)
      expect($('.govuk-accordion__section')).toHaveLength(1)
      expect($('.govuk-accordion__section-header').eq(0).text()).toMatch(areaName)
      const checkboxes = $('.govuk-accordion__section-content .govuk-checkboxes__item')
      expect(checkboxes).toHaveLength(1)
      expect(checkboxes.eq(0).text()).toMatch(`All office locations in the ${areaName} area`)
      const officeListItems = $('.govuk-list.govuk-list--bullet li')
      expect(officeListItems).toHaveLength(2)
      expect(officeListItems.eq(0).text()).toMatch(officeLocation)
      expect(officeListItems.eq(1).text()).toMatch(officeLocationTwo)

      const notifyStatus = $('.govuk-grid-column-one-third')
      expect(notifyStatus).toHaveLength(1)
      expect($('h2', notifyStatus).text()).toEqual('GOV.UK Notify Status')
      const statusTags = $('.govuk-tag', notifyStatus)
      expect(statusTags).toHaveLength(notifyStatusViewData.componentRows.length + 1)
      expect($(statusTags).eq(0).text()).toEqual(notifyStatusViewData.service.description)
      expect($(statusTags).eq(1).text()).toEqual($(notifyStatusViewData.componentRows[0][1].html).text())
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
      [{ officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, errorMessages.allOffices],
      [{ officeCodes: 'ABC:one', orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, errorMessages.allOffices],
      [{ allOffices: true, orgCodes: ['orgCode'], text: 'message to send', info: 'a'.repeat(maxInfoLength + 1) }, errorMessages.info],
      [{ allOffices: true, orgCodes: ['orgCode'], text: 'a'.repeat(maxMessageLength + 1) }, errorMessages.text],
      [{ allOffices: false, officeCodes: [], orgCodes: ['orgCode', 'another'], text: 'message to send', info: 'valid' }, errorMessages.officeCodes],
      [{ allOffices: false, officeCodes: [], orgCodes: 'orgCode', text: 'message to send', info: 'valid' }, errorMessages.officeCodes],
      [{ allOffices: false, officeCodes: ['ABC:one'], orgCodes: [], text: 'message to send', info: 'valid' }, errorMessages.orgCodes]
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
