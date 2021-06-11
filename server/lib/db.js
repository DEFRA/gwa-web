const { messagesContainer, refDataContainer, usersContainer } = require('../db/client')
const { referenceData } = require('../constants')

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
  return (await refDataContainer.item(referenceData.areaToOfficeMap, referenceData.areaToOfficeMap).read())?.resource?.data
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
 * @returns {Array} all resources.
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
  return (await refDataContainer.item(referenceData.organisationList, referenceData.organisationList).read())?.resource?.data
}

/**
 * Gets the `standardisedOffceLocationMap` item from the reference data
 * container.
 *
 * @returns {Array} list of areas with an array of `officeLocations`.
 */
async function getStandardisedOfficeLocationMap () {
  return (await refDataContainer.item(referenceData.standardisedOffceLocationMap, referenceData.standardisedOffceLocationMap).read())?.resource?.data
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
 * Get all users. This method is added to the web server via
 * [Server Methods](https://hapi.dev/tutorials/servermethods/?lang=en_US) to
 * improve performance.
 * It is accessible via `server.methods.db.getUsers`.
 *
 * @returns {Array} all users.
 */
async function getUsers () {
  return (await usersContainer.items.query('SELECT * FROM c').fetchAll()).resources
}

/**
 * Save the message.
 *
 * @param {object} message.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
async function saveMessage (message) {
  return messagesContainer.items.upsert(message)
}

/**
 * Update a message.
 *
 * @param {object} message with an `id`.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
async function updateMessage (message) {
  return messagesContainer.item(message.id, message.id).replace(message)
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

module.exports = {
  deleteMessage,
  getAreaToOfficeMap,
  getMessage,
  getMessages,
  getOrganisationList,
  getStandardisedOfficeLocationMap,
  getUser,
  getUsers,
  saveMessage,
  updateMessage,
  updateUser
}
