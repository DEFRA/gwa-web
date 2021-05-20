const scopes = {
  message: {
    approve: 'message:approve',
    send: 'message:send'
  },
  system: {
    maintain: 'system:maintain'
  }
}

const permissions = {
  Viewer: [],
  Editor: [],
  Manager: [scopes.message.approve],
  Administrator: [scopes.message.approve, scopes.message.send, scopes.system.maintain]
}

module.exports = {
  permissions,
  scopes
}
