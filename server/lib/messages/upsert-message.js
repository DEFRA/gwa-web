const addAuditEvent = require('./add-audit-event')
const { upsertMessage } = require('../db')

/**
 * Upserts the message with whatever the current state of it is. Adds an audit
 * event based on the user, prior to the upsert.
 *
 * @param {object} message to upsert.
 * @param {object} user performing action.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
module.exports = async (message, user) => {
  addAuditEvent(message, user)
  return upsertMessage(message)
}
