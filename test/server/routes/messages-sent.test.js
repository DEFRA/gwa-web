const cheerio = require('cheerio')
const generateMessages = require('../../helpers/generate-messages')
const { auditEventTypes, messages: { sentMessagePageSize }, messageStates, navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { formatDate } = require('../../../server/lib/misc/helpers')
const { scopes } = require('../../../server/permissions')

describe('Messages sent route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/messages-sent'
  let server

  const sentTime = Date.now()
  Date.now = jest.fn(() => sentTime)

  function cleanUpTableText (header) {
    return header.trim().replace(/[\n\r\t]/g, '').replace(/ +/g, ' ')
  }

  function expectMessagesSentTableOk ($, messagesOnPage) {
    expect($('.govuk-heading-l').text()).toEqual('Sent messages')

    const msgTables = $('.govuk-table')
    expect(msgTables).toHaveLength(1)
    expect(cleanUpTableText($('thead', msgTables.eq(0)).text())).toMatch('Last updated Text Sent by View')

    const sentUser = messagesOnPage[0].auditEvents.find(x => x.type === auditEventTypes.send).user.id
    const messageRows = $('tbody tr', msgTables.eq(0))
    expect(messageRows).toHaveLength(messagesOnPage.length)
    messageRows.each((i, row) => {
      const msg = messagesOnPage[i]
      expect(cleanUpTableText($(row).text())).toMatch(`${formatDate(msg.lastUpdatedAt)} ${msg.text} ${sentUser} View`)
      expect($('a', row).eq(0).attr('href')).toEqual(`mailto:${sentUser}`)
      expect($('a', row).eq(1).attr('href')).toEqual(`/message-view/${msg.id}`)
    })
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

    test.each([
      { nonValidUrl: `${url}/invalid` },
      { nonValidUrl: `${url}/0` }
    ])('responds with 400 when request URL includes non-valid input', async ({ nonValidUrl }) => {
      const res = await server.inject({
        method,
        url: nonValidUrl,
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
      expect($('.govuk-body').text()).toEqual('Invalid request params input')
    })

    test('responds with 404 when page requested would have no messages returned', async () => {
      server.methods.db.getSentMessages = jest.fn().mockResolvedValue([])
      const res = await server.inject({
        method,
        url: `${url}/9`,
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

      expect(res.statusCode).toEqual(404)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-body').text()).toEqual('No messages found')
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
      expect($('.govuk-heading-l').text()).toEqual('Sent messages')
      expect($('.govuk-body').text()).toMatch('Messages are ordered to show the most recently sent messages first')

      const msgTables = $('.govuk-table')
      expect(msgTables).toHaveLength(1)
      expect(cleanUpTableText($('thead', msgTables.eq(0)).text())).toMatch('Last updated Text Sent by View')
    })

    test('responds with 200 and paged messages when on first page of two', async () => {
      const sentMessages = generateMessages(sentMessagePageSize + 1, messageStates.sent)
      server.methods.db.getSentMessages = jest.fn().mockResolvedValue(sentMessages)

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
      expect($('.govuk-heading-l').text()).toEqual('Sent messages')

      expectMessagesSentTableOk($, sentMessages.slice(0, sentMessagePageSize))

      const previousLink = $('.govuk-pagination__item--prev')
      expect(previousLink.length).toEqual(0)
      const nextLink = $('.govuk-pagination__item--next')
      expect(nextLink.text()).toMatch('Next')
      expect($('a', nextLink).attr('href')).toEqual('/messages-sent/2')
      expect($('.govuk-pagination__results').text()).toMatch(`Showing 1 to ${sentMessagePageSize} of ${sentMessages.length} results`)
    })

    test('responds with 200 and paged messages when on second page of two', async () => {
      const sentMessages = generateMessages(sentMessagePageSize + 1, messageStates.sent)
      server.methods.db.getSentMessages = jest.fn().mockResolvedValue(sentMessages)

      const res = await server.inject({
        method,
        url: `${url}/2`,
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
      expect($('.govuk-heading-l').text()).toEqual('Sent messages')

      expectMessagesSentTableOk($, sentMessages.slice(sentMessagePageSize))

      const previousLink = $('.govuk-pagination__item--prev')
      expect(previousLink.text()).toMatch('Previous')
      expect($('a', previousLink).attr('href')).toEqual('/messages-sent/1')
      const nextLink = $('.govuk-pagination__item--next')
      expect(nextLink.length).toEqual(0)
      expect($('.govuk-pagination__results').text()).toMatch(`Showing ${sentMessagePageSize + 1} to ${sentMessages.length} of ${sentMessages.length} results`)
    })

    test('responds with 200 and paged messages when on second page of three', async () => {
      const sentMessages = generateMessages(sentMessagePageSize * 2 + 1, messageStates.sent)
      server.methods.db.getSentMessages = jest.fn().mockResolvedValue(sentMessages)

      const res = await server.inject({
        method,
        url: `${url}/2`,
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
      expect($('.govuk-heading-l').text()).toEqual('Sent messages')

      expectMessagesSentTableOk($, sentMessages.slice(sentMessagePageSize, sentMessagePageSize * 2))

      const previousLink = $('.govuk-pagination__item--prev')
      expect(previousLink.text()).toMatch('Previous')
      expect($('a', previousLink).attr('href')).toEqual('/messages-sent/1')
      const nextLink = $('.govuk-pagination__item--next')
      expect(nextLink.text()).toMatch('Next')
      expect($('a', nextLink).attr('href')).toEqual('/messages-sent/3')
      expect($('.govuk-pagination__results').text()).toMatch(`Showing ${sentMessagePageSize + 1} to ${sentMessagePageSize * 2} of ${sentMessages.length} results`)
    })
  })
})
