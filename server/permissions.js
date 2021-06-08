const scopes = {
  message: {
    manage: 'message:manage'
  },
  data: {
    manage: 'data:manage'
  }
}

const permissions = {
  Administrator: [scopes.message.manage, scopes.data.manage],
  DataManager: [scopes.data.manage],
  User: []
}

function getPermissions (roles) {
  if (roles) {
    const parsedRoles = JSON.parse(roles)

    if (Array.isArray(parsedRoles) && parsedRoles.length) {
      const knownRoles = parsedRoles.filter(role => role in permissions)

      if (knownRoles.length) {
        return [
          knownRoles,
          Array.from(new Set(knownRoles.map(role => permissions[role]).flat()))
        ]
      }
    }
  }

  return []
}

module.exports = {
  getPermissions,
  scopes
}
