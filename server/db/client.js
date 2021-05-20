const { CosmosClient } = require('@azure/cosmos')
const { db: dbConfig } = require('../config')

const client = new CosmosClient(dbConfig.connectionString)
const db = client.database(dbConfig.name)
const usersContainer = db.container(dbConfig.usersContainerName)
const refDataContainer = db.container(dbConfig.refDataContainerName)

module.exports = {
  refDataContainer,
  usersContainer
}
