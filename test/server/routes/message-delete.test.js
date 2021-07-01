const cheerio = require('cheerio')
const { v4: uuid } = require('uuid')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Message deletion route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = `/message-delete/${uuid()}`
  let server
  const state = 'created'
  const orgCodes = ['ABC:first', 'XYZ:last']
  const text = 'some message'
  const info = 'additional info'
  const mockCreateTime = new Date('2020-12-31T12:34:56')
  const mockUpdateTime = new Date('2021-01-02T08:00:00')
  const mockCreateUser = 'creating-things'
  const mockEditUser = 'editing-things'

  jest.mock('../../../server/lib/db', () => {
    return {
      getMessage: jest.fn().mockResolvedValue({
        auditEvents: [
          { user: { id: mockCreateUser }, type: 'create', time: mockCreateTime },
          { user: { id: mockEditUser }, type: 'create', time: mockUpdateTime }
        ],
        orgCodes,
        officeCodes: [],
        state,
        allOffices: true,
        text,
        info
      })
    }
  })

  beforeEach(async () => {
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
      expect($('.govuk-heading-l').text()).toMatch('Delete message')
      expect($('.govuk-warning-text').text()).toMatch('Are you sure you would like to delete this message?')
      const rows = $('.govuk-table .govuk-table__row')
      expect(rows).toHaveLength(9)
      expect($('th', rows.eq(0)).text()).toMatch('Message state')
      expect($('td', rows.eq(0)).text()).toMatch(state)
      expect($('th', rows.eq(1)).text()).toMatch('Office location recipients')
      expect($('td', rows.eq(1)).text()).toMatch('All offices')
      expect($('th', rows.eq(2)).text()).toMatch('Organisation recipients')
      expect($('td', rows.eq(2)).text()).toMatch(orgCodes.join(', '))
      expect($('th', rows.eq(3)).text()).toMatch('Message text')
      expect($('td', rows.eq(3)).text()).toMatch(text)
      expect($('th', rows.eq(4)).text()).toMatch('Additional information')
      expect($('td', rows.eq(4)).text()).toMatch(info)
      expect($('th', rows.eq(5)).text()).toMatch('Created at')
      expect($('td', rows.eq(5)).text()).toMatch(new Date(mockCreateTime).toLocaleString())
      expect($('th', rows.eq(6)).text()).toMatch('Created by')
      expect($('td', rows.eq(6)).text()).toMatch(mockCreateUser)
      expect($('th', rows.eq(7)).text()).toMatch('Last updated at')
      expect($('td', rows.eq(7)).text()).toMatch(new Date(mockUpdateTime).toLocaleString())
      expect($('th', rows.eq(8)).text()).toMatch('Last updated by')
      expect($('td', rows.eq(8)).text()).toMatch(mockEditUser)
      const buttons = $('.govuk-button')
      expect(buttons).toHaveLength(2)
      expect(buttons.eq(0).text()).toMatch('Cancel')
      expect(buttons.eq(1).text()).toMatch('Continue')
    })
  })

  describe('POST requests', () => {
    const method = 'POST'

    test.skip('responds with 200 when user has sufficient scope', async () => {
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
      expect($('.govuk-heading-l').text()).toMatch('Delete message')
    })
  })
})
