const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const { navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Message send route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = `/message-send/${uuid()}`
  let server
  const initialState = 'created'
  const orgCode = 'ABC'
  const orgCodes = ['ABC', 'XYZ']
  const text = 'some message'
  const info = 'additional info'
  const createTime = new Date('2020-12-31T12:34:56')
  const updateTime = new Date('2021-01-02T08:00:00')
  const createUser = 'creating-things'
  const edituser = 'editing-things'
  const officeCode = 'OFF:office'
  const number = '07777111111'
  const userList = [{ active: true, orgCode, phoneNumbers: [{ subscribedTo: [officeCode], number }] }]
  const message = {
    auditEvents: [
      { user: { id: createUser }, type: 'create', time: createTime },
      { user: { id: edituser }, type: 'create', time: updateTime }
    ],
    orgCodes,
    officeCodes: [],
    state: initialState,
    allOffices: true,
    text,
    info
  }
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

  jest.mock('../../../server/lib/data/upload-contact-list')
  const uploadContactList = require('../../../server/lib/data/upload-contact-list')
  jest.mock('../../../server/lib/db')
  const { getMessage, updateMessage } = require('../../../server/lib/db')
  const editTime = Date.now()
  Date.now = jest.fn(() => editTime)

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    server.methods.db.getUsers = jest.fn().mockResolvedValue(userList)
    server.methods.getNotifyStatusViewData = jest.fn().mockResolvedValue(notifyStatusViewData)
    getMessage.mockResolvedValue({ ...message })
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
      { message: { state: 'sent' }, status: 400, error: 'Sent messages can not be sent again.' }
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

    test('responds with 500 when user message update fails', async () => {
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
        }
      })

      expect(res.statusCode).toEqual(500)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Please try again later.')
    })

    test('responds with 200 and updates message when user has sufficient scope', async () => {
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
        }
      })

      expect(res.statusCode).toEqual(200)

      const cost = 0.016
      const contactCount = 1
      const updatedState = 'edited'
      expect(updateMessage).toHaveBeenCalledWith({
        cost,
        contactCount,
        lastUpdatedAt: editTime,
        ...message,
        state: updatedState
      })

      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('Send message')
      expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.messages.text)
      expect($('.govuk-phase-banner')).toHaveLength(1)
      expect($('.govuk-warning-text').text()).toMatch(`Are you sure you would like to send this message? It will be sent to approximately ${contactCount} contact(s) at an approximate cost of £${cost.toFixed(2)} (excluding VAT).`)
      const mainContent = $('.govuk-grid-column-two-thirds')
      const rows = $('.govuk-table .govuk-table__row', mainContent)
      expect(rows).toHaveLength(9)
      expect($('th', rows.eq(0)).text()).toMatch('Message state')
      expect($('td', rows.eq(0)).text()).toMatch(updatedState)
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
      expect($('td', rows.eq(7)).text()).toMatch(new Date(editTime).toLocaleString())
      expect($('th', rows.eq(8)).text()).toMatch('Last updated by')
      expect($('td', rows.eq(8)).text()).toMatch(id)
      const buttons = $('.govuk-button')
      expect(buttons).toHaveLength(2)
      expect(buttons.eq(0).text()).toMatch('Cancel')
      expect(buttons.eq(1).text()).toMatch('Continue')

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

    test('uploads contact list, updates message and responds with 302 to /messages when message has been sent', async () => {
      const dropGetUsersMock = jest.fn()
      server.methods.db.getUsers.cache = { drop: dropGetUsersMock }
      const dropGetSentMessagesMock = jest.fn()
      server.methods.db.getSentMessages.cache = { drop: dropGetSentMessagesMock }
      updateMessage.mockResolvedValue({ statusCode: 200 })
      uploadContactList.mockResolvedValue(true)

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

      expect(res.statusCode).toEqual(302)
      expect(res.headers.location).toEqual('/messages')

      const cost = 0.016
      const contactCount = 1
      const updatedState = 'sent'
      const updatedMessage = {
        cost,
        contactCount,
        contacts: [number],
        lastUpdatedAt: editTime,
        ...message,
        state: updatedState
      }
      expect(dropGetUsersMock).toHaveBeenCalled()
      expect(uploadContactList).toHaveBeenCalledWith(updatedMessage)
      expect(dropGetUsersMock).toHaveBeenCalled()
      expect(updateMessage).toHaveBeenCalledWith({
        ...updatedMessage
      })
    })

    test.each([
      { message: undefined, status: 404, error: 'Not Found' },
      { message: { state: 'sent' }, status: 400, error: 'Sent messages can not be sent again.' }
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

    test('responds with 400 when no users to send message to', async () => {
      server.methods.db.getUsers = jest.fn().mockResolvedValue([])
      server.methods.db.getUsers.cache = { drop: jest.fn() }

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

      expect(res.statusCode).toEqual(400)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Sending to 0 contacts is not allowed.')
    })

    test('responds with 500 when problem updating message', async () => {
      server.methods.db.getUsers.cache = { drop: jest.fn() }
      updateMessage.mockResolvedValue({ statusCode: 500 })
      uploadContactList.mockResolvedValue(true)

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

      expect(res.statusCode).toEqual(500)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Please try again later.')
    })

    test('responds with 500 when problem uploading contact list', async () => {
      server.methods.db.getUsers.cache = { drop: jest.fn() }
      updateMessage.mockResolvedValue({ statusCode: 200 })
      uploadContactList.mockResolvedValue(false)

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

      expect(res.statusCode).toEqual(500)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('Please try again later.')
    })
  })
})
