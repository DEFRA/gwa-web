const { referenceData } = require('../constants')
const { messagesContainer, refDataContainer, usersContainer } = require('../db/client')

async function deleteMessage (id) {
  return messagesContainer.item(id, id).delete()
}

// TODO: This should be stored in cache
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

// TODO: This should be stored in cache
async function getOrganisationList () {
  return (await refDataContainer.item(referenceData.organisationList, referenceData.organisationList).read())?.resource?.data
}

async function getUser (id) {
  const response = await usersContainer.item(id, id).read()
  return response.resource
}

// TODO: This query is expensive - needs thinking about, possibly caching regularly
async function getUsers () {
  // TODO: Remove metrics
  console.time('getUsers')
  const res = (await usersContainer.items.query('SELECT * FROM c', { populateQueryMetrics: true }).fetchAll()) // .resources
  console.timeEnd('getUsers')
  console.log(res)
  console.log('QUERY METRICS', res.headers['x-ms-documentdb-query-metrics'])
  return res.resources
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
