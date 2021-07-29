const { auditEventTypes, messageStates } = require('../../constants')

function getDate (val) {
  const date = new Date(val).toLocaleString()
  return date === 'Invalid Date' ? 'TBC' : date
}

/**
 * Generates rows to display a message in the form of a [GOV.UK
 * table](https://design-system.service.gov.uk/components/table/).
 *
 * @param {object} message containing message details.
 * @param {object} [{}] sentStats sent message specific stats.
 * @returns {Array} `items` for GOV.UK table
 */
module.exports = (message, sentStats = {}) => {
  const createEvent = message.auditEvents.filter(e => e.type === auditEventTypes.create)[0]
  const lastEvent = message.auditEvents.sort((e1, e2) => e2.time - e1.time)[0]

  const rows = [
    [{ text: 'Message state' }, { text: message.state.toUpperCase() }],
    [{ text: 'Office location recipients' }, { text: message.allOffices ? 'All offices' : message.officeCodes.join(', ') }],
    [{ text: 'Organisation recipients' }, { text: message.allOrgs ? 'All organisations' : message.orgCodes.join(', ') }],
    [{ text: 'Message text' }, { text: message.text }],
    [{ text: 'Additional information' }, { text: message.info }],
    [{ text: 'Created at' }, { text: getDate(createEvent.time) }],
    [{ text: 'Created by' }, { text: createEvent.user.id }],
    [{ text: 'Last updated at' }, { text: getDate(lastEvent.time) }],
    [{ text: 'Last updated by' }, { text: lastEvent.user.id }]
  ]
  if (message.state === messageStates.sent) {
    const sentEvent = message.auditEvents.filter(e => e.type === auditEventTypes.send)[0]
    rows.push(
      [{ text: 'Sent at' }, { text: getDate(sentEvent.time) }],
      [{ text: 'Sent by' }, { text: sentEvent.user.id }],
      [{ text: 'Approx cost' }, { text: `£${message.cost.toFixed(2)}` }],
      [{ text: 'Messages to send' }, { text: message.contactCount }],
      [{ text: 'Messages waiting to be sent by Notify' }, { text: sentStats.pendingSending }],
      [{ text: 'Messages failed to send to Notify' }, { text: sentStats.failedToSend }],
      [{ text: 'Messages rate limited' }, { text: sentStats.rateLimited }],
      [{ text: 'Messages retried' }, { text: sentStats.toBeRetried }],
      [{ text: 'Messages delivered by Notify' }, { text: sentStats.notifyDelivered }],
      [{ text: 'Messages failed by Notify' }, { text: sentStats.notifyFailed }],
      [{ text: 'First message sent at' }, { text: getDate(sentStats.timeOfFirstSend) }],
      [{ text: 'Last message sent at' }, { text: getDate(sentStats.timeOfLastSend) }]
    )
  }
  return rows
}
