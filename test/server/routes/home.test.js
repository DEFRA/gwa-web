const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Home route', () => {
  const url = '/'
  let server

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 200 when no user is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    expect($('#navigation').text()).toMatch('Sign in')
  })

  test('responds with 200 when user with no scope is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: []
            }
          },
          scope: []
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    const nav = $('#navigation li')
    expect(nav).toHaveLength(2)
    expect(nav.eq(0).text()).toMatch('Account')
    expect(nav.eq(1).text()).toMatch('Sign out')
  })

  test('responds with 200 when user with DataManager role scope is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: []
            }
          },
          scope: [scopes.data.manage]
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    const nav = $('#navigation li')
    expect(nav).toHaveLength(3)
    expect(nav.eq(0).text()).toMatch('Account')
    expect(nav.eq(1).text()).toMatch('Manage Data')
    expect(nav.eq(2).text()).toMatch('Sign out')
  })

  test('responds with 200 when user with Administrator role scope is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: []
            }
          },
          scope: [scopes.data.manage, scopes.message.manage]
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    const nav = $('#navigation li')
    expect(nav).toHaveLength(4)
    expect(nav.eq(0).text()).toMatch('Account')
    expect(nav.eq(1).text()).toMatch('Messages')
    expect(nav.eq(2).text()).toMatch('Manage Data')
    expect(nav.eq(3).text()).toMatch('Sign out')
  })
})
