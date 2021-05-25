const { refDataContainer, usersContainer } = require('../db/client')

async function getUser (id) {
  const response = await usersContainer.item(id, id).read()
  return response.resource
}

async function updateUser (user) {
  return await usersContainer.item(user.id, user.id).replace(user)
}

// TODO: This should be stored in cache
async function getAreaToOfficeMap () {
  return (await refDataContainer.item('areaToOfficeMap', 'areaToOfficeMap').read())?.resource?.data
}

module.exports = {
  getAreaToOfficeMap,
  getUser,
  updateUser
}
