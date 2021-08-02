const { messagesContainer, receiptsContainer, refDataContainer, usersContainer } = require('../db/client')
const { referenceData } = require('../constants')

async function getReferenceData (id) {
  return (await refDataContainer.item(id, id).read())?.resource?.data
}

/**
 * Delete a message by id (guid).
 *
 * @param {string} id (guid) of the message to delete.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
async function deleteMessage (id) {
  return messagesContainer.item(id, id).delete()
}

/**
 * Gets the `areaToOfficeMap` item from the reference data container. This
 * method is added to the web server via
 * [Server Methods](https://hapi.dev/tutorials/servermethods/?lang=en_US) to
 * improve performance.
 * It is accessible via `server.methods.db.getAreaToOfficeMap`.
 *
 * @returns {Array} list of areas with an array of `officeLocations`.
 */
async function getAreaToOfficeMap () {
  return getReferenceData(referenceData.areaToOfficeMap)
}

/**
 * Get a message by id (guid).
 *
 * @param {string} id (guid) of message.
 * @returns {object} the requested resource.
 */
async function getMessage (id) {
  return (await messagesContainer.item(id, id).read()).resource
}

/**
 * Gets messages based on the query via the `fetchAll` function.
 *
 * @param {string} query to run.
 * @returns {Array} resources.
 */
async function getMessages (query) {
  return (await messagesContainer.items.query(query).fetchAll()).resources
}

/**
 * Get the `organisationList` item from the reference data container. This
 * method is added to the web server via
 * [Server Methods](https://hapi.dev/tutorials/servermethods/?lang=en_US) to
 * improve performance.
 * It is accessible via `server.methods.db.getOrganisationList`.
 *
 * @returns {Array} all organisations consisting of `active`, `orgCode` and
 * `orgName`.
 */
async function getOrganisationList () {
  return getReferenceData(referenceData.organisationList)
}

/**
 * Get the `organisationMap` item from the reference data container.
 *
 * @returns {Array} all mappings between `originalOrgName` and the actual
 * organisation. Organisation consists of `orgCode` and `orgName`.
 */
async function getOrganisationMap () {
  return getReferenceData(referenceData.organisationMap)
}

/**
 * Get receipts based on the query via the `fetchAll` function.
 *
 * @param {string} query to run.
 * @returns {Array} resources.
 */
async function getReceipts (query) {
  return (await receiptsContainer.items.query(query).fetchAll()).resources
}

/**
 * Gets the `standardisedOffceLocationMap` item from the reference data
 * container. This method is added to the web server via
 * [Server Methods](https://hapi.dev/tutorials/servermethods/?lang=en_US) to
 * improve performance.
 * It is accessible via `server.methods.db.getStandardisedOfficeLocationMap`.
 *
 * @returns {Array} list of areas with an array of `officeLocations`.
 */
async function getStandardisedOfficeLocationMap () {
  return getReferenceData(referenceData.standardisedOfficeLocationMap)
}

/**
 * Get a user by id (lowercased email address).
 *
 * @param {string} id (lowercased email address).
 * @returns {object} the user.
 */
async function getUser (id) {
  return (await usersContainer.item(id, id).read()).resource
}

/**
 * Get selected properties (`active`, `orgCode`, `phoneNumbers`) for all users.
 *
 * The query is used to determine the phone numbers a message will be sent to
 * and only requires the properties returned.
 * The query sets the `maxItemCount` option to `50000` as this gave the best
 * performance. The default option of `100` was taking ~17 seconds.
 * Setting the value to `1000` reduced the duration, as did `10000`.
 * After some experimentation `50000` proved the most performant. This is
 * likely as it covers all items in the container.
 * This should be the case for as long as this system runs.
 * The query only returns selected properties as it reduces the duration of the
 * query by >50% from ~1.7 seconds to ~0.7 seconds. The RU/s cost is also
 * reduced.
 *
 * @returns {Array} all users.
 */
async function getUsers () {
  return (await usersContainer.items.query('SELECT c.active, c.orgCode, c.phoneNumbers FROM c', { maxItemCount: 50000 }).fetchAll()).resources
}

async function getUserStats () {
  return (await usersContainer.items.query('SELECT c.active, COUNT(c.orgCode) as count, c.orgCode FROM c GROUP BY c.orgCode, c.active').fetchAll()).resources
}

/**
 * Upsert the message.
 *
 * @param {object} message.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
async function upsertMessage (message) {
  return messagesContainer.items.upsert(message)
}

/**
 * Update a user.
 *
 * @param {object} user with an `id`.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
async function updateUser (user) {
  return usersContainer.item(user.id, user.id).replace(user)
}

/**
 * Update a reference data item.
 *
 * @param {object} referenceDataItem with an `id` matching a referenceData item.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
async function updateReferenceData (referenceDataItem) {
  return refDataContainer.item(referenceDataItem.id, referenceDataItem.id).replace(referenceDataItem)
}

module.exports = {
  deleteMessage,
  getAreaToOfficeMap,
  getMessage,
  getMessages,
  getOrganisationList,
  getOrganisationMap,
  getReceipts,
  getStandardisedOfficeLocationMap,
  getUser,
  getUsers,
  getUserStats,
  updateReferenceData,
  updateUser,
  upsertMessage
}
