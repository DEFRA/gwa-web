describe('Permissions and scopes', () => {
  const { getPermissions, scopes } = require('../../server/permissions')

  test('User role with no scopes is returned when no roles are supplied', () => {
    const { roles, scope } = getPermissions()

    expect(roles).toHaveLength(1)
    expect(roles).toEqual(expect.arrayContaining(['User']))
    expect(scope).toHaveLength(0)
    expect(scope).toEqual(expect.arrayContaining([]))
  })

  test('User role with no scopes is returned when no recognised roles are supplied', () => {
    const { roles, scope } = getPermissions(JSON.stringify(['Unknown']))

    expect(roles).toHaveLength(1)
    expect(roles).toEqual(expect.arrayContaining(['User']))
    expect(scope).toHaveLength(0)
    expect(scope).toEqual(expect.arrayContaining([]))
  })

  test('known roles and scopes are returned when recognised roles are supplied', () => {
    const rolesInput = JSON.stringify(['Administrator', 'DataManager', 'User', 'Unknown'])

    const { roles, scope } = getPermissions(rolesInput)

    expect(roles).toHaveLength(3)
    expect(roles).toEqual(expect.arrayContaining(['Administrator', 'DataManager', 'User']))
    expect(roles).not.toEqual(expect.arrayContaining(['Unknown']))
    expect(scope).toHaveLength(2)
    expect(scope).toEqual(expect.arrayContaining([scopes.message.manage, scopes.data.manage]))
  })

  test('Administrator role returns correct role and scope', () => {
    const rolesInput = JSON.stringify(['Administrator'])

    const { roles, scope } = getPermissions(rolesInput)

    expect(roles).toHaveLength(1)
    expect(roles).toEqual(expect.arrayContaining(['Administrator']))
    expect(scope).toHaveLength(2)
    expect(scope).toEqual(expect.arrayContaining([scopes.message.manage, scopes.data.manage]))
  })

  test('DataManager role returns correct role and scope', () => {
    const rolesInput = JSON.stringify(['DataManager'])

    const { roles, scope } = getPermissions(rolesInput)

    expect(roles).toHaveLength(1)
    expect(roles).toEqual(expect.arrayContaining(['DataManager']))
    expect(scope).toHaveLength(1)
    expect(scope).toEqual(expect.arrayContaining([scopes.data.manage]))
  })

  test('User role returns correct role and scope', () => {
    const rolesInput = JSON.stringify(['User'])

    const { roles, scope } = getPermissions(rolesInput)

    expect(roles).toHaveLength(1)
    expect(roles).toEqual(expect.arrayContaining(['User']))
    expect(scope).toHaveLength(0)
    expect(scope).toEqual(expect.arrayContaining([]))
  })
})
