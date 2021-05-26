const { messagesContainer, refDataContainer, usersContainer } = require('../db/client')

async function deleteMessage (id) {
  return await messagesContainer.item(id, id).delete()
}

// TODO: This should be stored in cache
async function getAreaToOfficeMap () {
  return (await refDataContainer.item('areaToOfficeMap', 'areaToOfficeMap').read())?.resource?.data
}

async function getMessage (id) {
  const response = await messagesContainer.item(id, id).read()
  return response.resource
}

async function getMessages (query) {
  return (await messagesContainer.items.query(query).fetchAll()).resources
}

async function getUser (id) {
  const response = await usersContainer.item(id, id).read()
  return response.resource
}

async function saveMessage (msg) {
  return await messagesContainer.items.upsert(msg)
}

async function updateMessage (msg) {
  return await messagesContainer.item(msg.id, msg.id).replace(msg)
}

async function updateUser (user) {
  return await usersContainer.item(user.id, user.id).replace(user)
}

module.exports = {
  deleteMessage,
  getAreaToOfficeMap,
  getMessage,
  getMessages,
  getUser,
  saveMessage,
  updateMessage,
  updateUser
}
