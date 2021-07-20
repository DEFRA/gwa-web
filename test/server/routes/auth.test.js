const createServer = require('../../../server/index')
const testEnvVars = require('../../test-env-vars')

describe('Auth route', () => {
  const url = '/login'
  let server
  const method = 'GET'

  jest.mock('../../../server/lib/db')
  const { getUser } = require('../../../server/lib/db')
  getUser
    .mockResolvedValue({ active: true })
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ active: false })

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 302 when no user exists', async () => {
    const res = await server.inject({
      method,
      url
    })

    expect(res.statusCode).toEqual(302)
  })

  test('responds with 404 when user is not found', async () => {
    const res = await server.inject({
      method,
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify(['Administrator'])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(404)
  })

  test('responds with 404 when user is found but is not active', async () => {
    const res = await server.inject({
      method,
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify(['Administrator'])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(404)
  })

  test('responds with 302 to /account when user is active and has no roles', async () => {
    const res = await server.inject({
      method,
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: { }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(302)
    expect(res.headers.location).toEqual('/account')
  })

  test('responds with 302 to /account when user is active and has no recognised roles', async () => {
    const res = await server.inject({
      method,
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify(['Not-recognised-role'])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(302)
    expect(res.headers.location).toEqual('/account')
  })

  test('responds with 302 to /account when active user is found', async () => {
    const res = await server.inject({
      method,
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify(['Administrator'])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(302)
    expect(res.headers.location).toEqual('/account')
  })

  test('responds with 302 to the redirectTo query (when available), when active user is found', async () => {
    const redirectTo = '/a-different-route'
    const res = await server.inject({
      method,
      url,
      auth: {
        credentials: {
          query: {
            redirectTo
          },
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify(['Administrator'])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(302)
    expect(res.headers.location).toEqual(redirectTo)
  })

  test('responds with 302 to the microsoftonline logout URL', async () => {
    const res = await server.inject({
      method,
      url: '/logout'
    })

    expect(res.statusCode).toEqual(302)
    expect(res.headers.location).toEqual(`https://login.microsoftonline.com/${testEnvVars.aadTenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${testEnvVars.logoutRedirectUri}`)
  })
})
