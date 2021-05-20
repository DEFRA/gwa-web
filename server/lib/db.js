const { refDataContainer, usersContainer } = require('../db/client')

async function getUser (id) {
  const response = await usersContainer.item(id, id).read()
  return response.resource
}

async function updateUser (user) {
  const response = await usersContainer.item(user.id, user.id).replace(user)
  return response.resource
}

async function getAreaToOfficeMap () {
  const response = await refDataContainer.item('areaToOfficeMap', 'areaToOfficeMap').read()
  return response.resource
}

module.exports = {
  getAreaToOfficeMap,
  getUser,
  updateUser
}
