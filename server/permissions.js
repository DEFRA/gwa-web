const roles = {
  Administrator: 'Administrator',
  DataManager: 'DataManager',
  User: 'User'
}

const scopes = {
  message: {
    manage: 'message:manage'
  },
  data: {
    manage: 'data:manage'
  }
}

/**
 * Mapping of roles to scopes.
 */
const permissions = {
  [roles.Administrator]: [scopes.message.manage, scopes.data.manage],
  [roles.DataManager]: [scopes.data.manage],
  [roles.User]: []
}

/**
 * Return the known role(s) and scope(s) for the role(s) requested.
 *
 * @param {Array} userRoles from the Azure AD response.
 * @return {object} consisting of (matched, known - if any) `roles` and `scope`
 * for the supplied `roles`.
 */
function getPermissions (userRoles) {
  if (userRoles) {
    const parsedRoles = JSON.parse(userRoles)

    if (Array.isArray(parsedRoles) && parsedRoles.length) {
      const knownRoles = parsedRoles.filter(role => role in permissions)

      if (knownRoles.length) {
        return {
          roles: knownRoles,
          scope: Array.from(new Set(knownRoles.map(role => permissions[role]).flat()))
        }
      }
    }
  }

  return {}
}

module.exports = {
  getPermissions,
  scopes
}
