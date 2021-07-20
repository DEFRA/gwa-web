const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const { expectNotifyStatus, notifyStatusViewData } = require('../../helpers/notify-status')
const { navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Message view route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = `/message-view/${uuid()}`
  let server
  const state = 'created'
  const orgCodes = ['ABC', 'XYZ']
  const text = 'some message'
  const info = 'additional info'
  const createTime = new Date('2020-12-31T12:34:56')
  const updateTime = new Date('2021-01-02T08:00:00')
  const createUser = 'creating-things'
  const edituser = 'editing-things'

  jest.mock('../../../server/lib/db')
  const { getMessage } = require('../../../server/lib/db')
  const message = {
    auditEvents: [
      { user: { id: createUser }, type: 'create', time: createTime },
      { user: { id: edituser }, type: 'create', time: updateTime }
    ],
    orgCodes,
    officeCodes: [],
    state,
    allOffices: true,
    text,
    info
  }

  const sentTime = Date.now()
  Date.now = jest.fn(() => sentTime)

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    server.methods.getNotifyStatusViewData = jest.fn().mockResolvedValue(notifyStatusViewData)
    getMessage.mockResolvedValue(message)
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
      { message: undefined, status: 404, error: 'Not Found' }
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

    test('responds with 200 with all buttons when user has sufficient scope', async () => {
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
      expect($('.govuk-phase-banner')).toHaveLength(1)
      expect($('.govuk-heading-l').text()).toMatch('View message')
      const mainContent = $('.govuk-grid-column-two-thirds')
      const rows = $('.govuk-table .govuk-table__row', mainContent)
      expect(rows).toHaveLength(9)
      expect($('th', rows.eq(0)).text()).toMatch('Message state')
      expect($('td', rows.eq(0)).text()).toMatch(state.toUpperCase())
      expect($('th', rows.eq(1)).text()).toMatch('Office location recipients')
      expect($('td', rows.eq(1)).text()).toMatch('All offices')
      expect($('th', rows.eq(2)).text()).toMatch('Organisation recipients')
      expect($('td', rows.eq(2)).text()).toMatch(orgCodes.join(', '))
      expect($('th', rows.eq(3)).text()).toMatch('Message text')
      expect($('td', rows.eq(3)).text()).toMatch(text)
      expect($('th', rows.eq(4)).text()).toMatch('Additional information')
      expect($('td', rows.eq(4)).text()).toMatch(info)
      expect($('th', rows.eq(5)).text()).toMatch('Created at')
      expect($('td', rows.eq(5)).text()).toMatch(new Date(createTime).toLocaleString())
      expect($('th', rows.eq(6)).text()).toMatch('Created by')
      expect($('td', rows.eq(6)).text()).toMatch(createUser)
      expect($('th', rows.eq(7)).text()).toMatch('Last updated at')
      expect($('td', rows.eq(7)).text()).toMatch(new Date(updateTime).toLocaleString())
      expect($('th', rows.eq(8)).text()).toMatch('Last updated by')
      expect($('td', rows.eq(8)).text()).toMatch(edituser)
      const buttons = $('.govuk-button')
      expect(buttons).toHaveLength(3)
      expect(buttons.eq(0).text()).toMatch('Edit message')
      expect(buttons.eq(1).text()).toMatch('Delete message')
      expect(buttons.eq(2).text()).toMatch('Send message')

      expectNotifyStatus($)
    })

    test('responds with 200 with extra rows and no buttons when message is sent and user has sufficient scope', async () => {
      const cost = 0.016
      const contactCount = 1
      const sentMessage = { ...message, state: 'sent', cost, contactCount }
      sentMessage.auditEvents.push({ user: { id }, type: 'send', time: sentTime })
      getMessage.mockResolvedValueOnce(sentMessage)
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
      expect($('.govuk-button')).toHaveLength(0)
      const mainContent = $('.govuk-grid-column-two-thirds')
      const rows = $('.govuk-table .govuk-table__row', mainContent)
      expect(rows).toHaveLength(13)
      expect($('th', rows.eq(9)).text()).toMatch('Sent at')
      expect($('td', rows.eq(9)).text()).toMatch(new Date(sentTime).toLocaleString())
      expect($('th', rows.eq(10)).text()).toMatch('Sent by')
      expect($('td', rows.eq(10)).text()).toMatch(id)
      expect($('th', rows.eq(11)).text()).toMatch('Approx cost')
      expect($('td', rows.eq(11)).text()).toMatch(`£${cost.toFixed(2)}`)
      expect($('th', rows.eq(12)).text()).toMatch('Approx message sent count')
      expect($('td', rows.eq(12)).text()).toMatch(`${contactCount}`)
    })
  })
})
