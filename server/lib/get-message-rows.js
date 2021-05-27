const { messageStates } = require('../constants')

/**
 * Generates rows to display a message in the form of a [GOV.UK
 * table](https://design-system.service.gov.uk/components/table/).
 *
 * @param {object} message - object with message details
 */
module.exports = (message) => {
  // TODO: The rows with 'pending' below can all come from message.auditEvents
  // which is an array of different events
  const rows = [
    [{ text: 'Message state' }, { text: message.state }],
    [{ text: 'To' }, { text: message.officeCodes.join(', ') }],
    [{ text: 'Text message' }, { text: message.text }],
    [{ text: 'Additional information' }, { text: message.info }],
    [{ text: 'Created at' }, { text: new Date(message.createdAt).toLocaleString() }],
    [{ text: 'Created by' }, { text: 'pending' }],
    [{ text: 'Last updated at' }, { text: 'pending' }],
    [{ text: 'Last updated by' }, { text: 'pending' }],
    [{ text: 'Sent at' }, { text: 'pending' }],
    [{ text: 'Sent by' }, { text: 'pending' }]
  ]
  if (message.state === messageStates.sent) {
    rows.push(
      [{ text: 'Approx cost' }, { text: `£${message.cost}` }],
      [{ text: 'Approx message sent count' }, { text: message.contactCount }]
    )
  }
  return rows
}
