const createServer = require('../../../server/index')

describe('Home route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 200 when no user is logged in', async () => {
    const res = await server.inject({
      method: 'get',
      url: '/'
    })

    expect(res.statusCode).toEqual(200)
  })

  test('responds with 200 when user is logged in', async () => {
    const res = await server.inject({
      method: 'get',
      url: '/',
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: ['Administrator']
            }
          },
          scope: []
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)
  })
})
