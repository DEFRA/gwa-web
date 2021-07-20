const { auditEventTypes, messageStates } = require('../../constants')

/**
 * Generates rows to display a message in the form of a [GOV.UK
 * table](https://design-system.service.gov.uk/components/table/).
 *
 * @param {object} message containing message details.
 * @returns {Array} `items` for GOV.UK table
 */
module.exports = (message) => {
  const createEvent = message.auditEvents.filter(e => e.type === auditEventTypes.create)[0]
  const lastEvent = message.auditEvents.sort((e1, e2) => e2.time - e1.time)[0]

  const rows = [
    [{ text: 'Message state' }, { text: message.state }],
    [{ text: 'Office location recipients' }, { text: message.allOffices ? 'All offices' : message.officeCodes.join(', ') }],
    [{ text: 'Organisation recipients' }, { text: message.orgCodes.join(', ') }],
    [{ text: 'Message text' }, { text: message.text }],
    [{ text: 'Additional information' }, { text: message.info }],
    [{ text: 'Created at' }, { text: new Date(createEvent.time).toLocaleString() }],
    [{ text: 'Created by' }, { text: createEvent.user.id }],
    [{ text: 'Last updated at' }, { text: new Date(lastEvent.time).toLocaleString() }],
    [{ text: 'Last updated by' }, { text: lastEvent.user.id }]
  ]
  if (message.state === messageStates.sent) {
    const sentEvent = message.auditEvents.filter(e => e.type === auditEventTypes.send)[0]
    rows.push(
      [{ text: 'Sent at' }, { text: new Date(sentEvent.time).toLocaleString() }],
      [{ text: 'Sent by' }, { text: sentEvent.user.id }],
      [{ text: 'Approx cost' }, { text: `£${message.cost.toFixed(2)}` }],
      [{ text: 'Approx message sent count' }, { text: message.contactCount }]
    )
  }
  return rows
}
