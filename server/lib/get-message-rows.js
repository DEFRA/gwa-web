/**
 * Generates rows to display a message in the form of a [GOV.UK
 * table](https://design-system.service.gov.uk/components/table/).
 *
 * @param {Object} message - object with message details
 */
module.exports = (message) => {
  return [
    [{ text: 'To' }, { text: message.officeLocations.join(', ') }],
    [{ text: 'Text message' }, { text: message.text }],
    [{ text: 'Additional information' }, { text: message.info }],
    [{ text: 'Created at' }, { text: new Date(message.createdAt).toLocaleString() }],
    [{ text: 'Created by' }, { text: 'pending' }],
    [{ text: 'Last updated at' }, { text: 'pending' }],
    [{ text: 'Last updated by' }, { text: 'pending' }],
    [{ text: 'Sent at' }, { text: 'pending' }],
    [{ text: 'Sent by' }, { text: 'pending' }]
  ]
}
