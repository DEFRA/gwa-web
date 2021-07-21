const { internalStatuses, notifyStatuses } = require('./receipt-statuses')
const { getReceipts } = require('../../lib/db')

/**
 * Gets the data to be displayed for sent messages from the receipts DB container.
 *
 * @param {string} messageId of the message to return stats on.
 * @returns {object} stats of the sent message.
 */
module.exports = async messageId => {
  const [failedToSend, notifyDelivered, notifyFailed, pendingSending, rateLimited, timeOfFirstSend, timeOfLastSend, toBeRetried] = await Promise.all([
    getReceipts(`SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.failedToSend}"`),
    getReceipts(`SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${notifyStatuses.delivered}"`),
    getReceipts(`SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status IN ("${notifyStatuses.permanentFailure}", "${notifyStatuses.temporaryFailure}", "${notifyStatuses.technicalFailure}")`),
    getReceipts(`SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.sent}"`),
    getReceipts(`SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.rateLimited}"`),
    getReceipts(`SELECT TOP 1 c.sent_at FROM c WHERE c.messageId = "${messageId}" AND c.status = "${notifyStatuses.delivered}" ORDER BY c.sent_at ASC`),
    getReceipts(`SELECT TOP 1 c.sent_at FROM c WHERE c.messageId = "${messageId}" AND c.status = "${notifyStatuses.delivered}" ORDER BY c.sent_at DESC`),
    getReceipts(`SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.retry}"`)
  ])

  return {
    failedToSend: failedToSend[0]?.count,
    notifyDelivered: notifyDelivered[0]?.count,
    notifyFailed: notifyFailed[0]?.count,
    pendingSending: pendingSending[0]?.count,
    rateLimited: rateLimited[0]?.count,
    timeOfFirstSend: timeOfFirstSend[0]?.sent_at,
    timeOfLastSend: timeOfLastSend[0]?.sent_at,
    toBeRetried: toBeRetried[0]?.count
  }
}
