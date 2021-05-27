const { auditEventTypes, messageStates } = require('../constants')

/**
 * Adds audit events to the `auditEvents` property on a message, based on
 * the `state` property of the message.
 *
 * @param {object} message - the message to add audit events to.
 * @param {object} user - the user to assign the audit events to.
 */
module.exports = (message, user) => {
  let type
  switch (message.state) {
    case messageStates.created:
      type = auditEventTypes.create
      break
    case messageStates.edited:
      type = auditEventTypes.edit
      break
    case messageStates.sent:
      type = auditEventTypes.send
      break
    default:
      throw new Error(`Message state '${message.state}' does not have a matching audit event type.`)
  }

  if (!message.auditEvents) {
    message.auditEvents = []
  }
  message.auditEvents.push({
    type,
    time: Date.now(),
    user: {
      id: user.id,
      surname: user.surname,
      givenName: user.givenName,
      companyName: user.companyName
    }
  })
}
