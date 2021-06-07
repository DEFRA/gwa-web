const { messagesContainer, refDataContainer, usersContainer } = require('../db/client')
const { referenceData } = require('../constants')

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
 * @returns {object} map of areas with array of `officeLocations`.
 */
async function getAreaToOfficeMap () {
  return (await refDataContainer.item(referenceData.areaToOfficeMap, referenceData.areaToOfficeMap).read())?.resource?.data
}

async function getMessage (id) {
  const response = await messagesContainer.item(id, id).read()
  return response.resource
}

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

async function getUser (id) {
  const response = await usersContainer.item(id, id).read()
  return response.resource
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

async function saveMessage (msg) {
  return messagesContainer.items.upsert(msg)
}

async function updateMessage (msg) {
  return messagesContainer.item(msg.id, msg.id).replace(msg)
}

async function updateUser (user) {
  return usersContainer.item(user.id, user.id).replace(user)
}

module.exports = {
  deleteMessage,
  getAreaToOfficeMap,
  getMessage,
  getMessages,
  getOrganisationList,
  getUser,
  getUsers,
  saveMessage,
  updateMessage,
  updateUser
}
