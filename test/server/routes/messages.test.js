const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const generateMessages = require('../../helpers/generate-messages')
const { auditEventTypes, messageStates, navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Messages route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/messages'
  let server

  jest.mock('../../../server/lib/db')
  const { getMessages } = require('../../../server/lib/db')

  const sentTime = Date.now()
  Date.now = jest.fn(() => sentTime)

  function cleanUpTableText (header) {
    return header.trim().replace(/[\n\r\t]/g, '').replace(/ +/g, ' ')
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
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

    test('responds with 200 and no messages when there are no messages', async () => {
      server.methods.db.getSentMessages = jest.fn().mockResolvedValue([])

      const messages = []
      getMessages.mockResolvedValue(messages)
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
      expect(getMessages).toHaveBeenCalledTimes(2)
      expect(getMessages).toHaveBeenCalledWith(`SELECT TOP 10 * FROM c WHERE c.state = "${messageStates.created}" ORDER BY c.lastUpdatedAt DESC`)
      expect(getMessages).toHaveBeenCalledWith(`SELECT TOP 10 * FROM c WHERE c.state = "${messageStates.edited}" ORDER BY c.lastUpdatedAt DESC`)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.messages.text)
      expect($('.govuk-heading-l').text()).toEqual('Messages')
      const msgHeadings = $('.govuk-heading-m')
      expect(msgHeadings).toHaveLength(3)
      const buttons = $('.govuk-button')
      expect(buttons).toHaveLength(2)
      expect(buttons.eq(0).text()).toMatch('Create message')
      expect(buttons.eq(0).attr('href')).toEqual('/message-create')
      expect(buttons.eq(1).text()).toMatch('View all sent messages')
      expect(buttons.eq(1).attr('href')).toEqual('/messages-sent')

      expect(msgHeadings.eq(0).text()).toMatch('Messages recently created')
      expect(msgHeadings.eq(1).text()).toMatch('Messages recently updated')
      expect(msgHeadings.eq(2).text()).toMatch('Messages recently sent')
      const msgTables = $('.govuk-table')
      expect(msgTables).toHaveLength(3)
      expect(cleanUpTableText($('thead', msgTables.eq(0)).text())).toMatch('Last updated Text Created by View')
      expect(cleanUpTableText($('thead', msgTables.eq(1)).text())).toMatch('Last updated Text Updated by View')
      expect(cleanUpTableText($('thead', msgTables.eq(2)).text())).toMatch('Last updated Text Sent by View')
    })

    test('responds with 200 and messages in correct places', async () => {
      const sentMessages = generateMessages(1, messageStates.sent)
      server.methods.db.getSentMessages = jest.fn().mockResolvedValue(sentMessages)

      const text = 'some message'
      const createUser = 'creating-things'
      const edituser = 'editing-things'
      const sentUser = sentMessages[0].auditEvents.find(x => x.type === auditEventTypes.send).user.id
      const createTime = new Date('2020-12-31T12:34:56')
      const updateTime = new Date('2021-01-02T08:00:00')
      const baseMessage = {
        auditEvents: [
          { user: { id: createUser }, type: 'create', time: createTime },
          { user: { id: edituser }, type: 'create', time: updateTime }
        ],
        lastUpdatedAt: new Date('2021-02-03T09:00:00'),
        text
      }
      const createMessageBase = { ...baseMessage, state: 'created', id: uuid() }
      const editedMessageBase = { ...baseMessage, state: 'edited', id: uuid() }
      const createdMessages = [createMessageBase]
      const editedMessages = [editedMessageBase]
      getMessages
        .mockResolvedValueOnce(createdMessages)
        .mockResolvedValueOnce(editedMessages)

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
      expect($('.govuk-heading-l').text()).toEqual('Messages')
      const msgHeadings = $('.govuk-heading-m')
      expect(msgHeadings).toHaveLength(3)
      const buttons = $('.govuk-button')
      expect(buttons).toHaveLength(2)
      expect(buttons.eq(0).text()).toMatch('Create message')
      expect(buttons.eq(0).attr('href')).toEqual('/message-create')
      expect(buttons.eq(1).text()).toMatch('View all sent messages')
      expect(buttons.eq(1).attr('href')).toEqual('/messages-sent')

      expect(msgHeadings.eq(0).text()).toMatch('Messages recently created')
      expect(msgHeadings.eq(1).text()).toMatch('Messages recently updated')
      expect(msgHeadings.eq(2).text()).toMatch('Messages recently sent')
      const msgTables = $('.govuk-table')
      expect(msgTables).toHaveLength(3)
      expect(cleanUpTableText($('thead', msgTables.eq(0)).text())).toMatch('Last updated Text Created by View')
      expect(cleanUpTableText($('thead', msgTables.eq(1)).text())).toMatch('Last updated Text Updated by View')
      expect(cleanUpTableText($('thead', msgTables.eq(2)).text())).toMatch('Last updated Text Sent by View')

      const msgCreatedRows = $('tbody tr', msgTables.eq(0))
      expect(msgCreatedRows).toHaveLength(createdMessages.length)
      expect(cleanUpTableText(msgCreatedRows.text())).toMatch(`${new Date(createMessageBase.lastUpdatedAt).toLocaleString()} ${createMessageBase.text} ${edituser} View`)
      expect($('a', msgCreatedRows).eq(0).attr('href')).toEqual(`mailto:${edituser}`)
      expect($('a', msgCreatedRows).eq(1).attr('href')).toEqual(`/message-view/${createMessageBase.id}`)

      const msgEditedRows = $('tbody tr', msgTables.eq(1))
      expect(msgEditedRows).toHaveLength(editedMessages.length)
      expect(cleanUpTableText(msgEditedRows.text())).toMatch(`${new Date(editedMessageBase.lastUpdatedAt).toLocaleString()} ${editedMessageBase.text} ${edituser} View`)
      expect($('a', msgEditedRows).eq(0).attr('href')).toEqual(`mailto:${edituser}`)
      expect($('a', msgEditedRows).eq(1).attr('href')).toEqual(`/message-view/${editedMessageBase.id}`)

      const msgSentRows = $('tbody tr', msgTables.eq(2))
      expect(msgSentRows).toHaveLength(sentMessages.length)
      expect(cleanUpTableText(msgSentRows.text())).toMatch(`${new Date(sentMessages[0].lastUpdatedAt).toLocaleString()} ${sentMessages[0].text} ${sentUser} View`)
      expect($('a', msgSentRows).eq(0).attr('href')).toEqual(`mailto:${sentUser}`)
      expect($('a', msgSentRows).eq(1).attr('href')).toEqual(`/message-view/${sentMessages[0].id}`)
    })
  })
})
