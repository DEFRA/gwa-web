const { CosmosClient } = require('@azure/cosmos')
const { db: dbConfig } = require('../config')

const client = new CosmosClient(dbConfig.connectionString)
const db = client.database(dbConfig.name)
const messagesContainer = db.container(dbConfig.messagesContainerName)
const refDataContainer = db.container(dbConfig.refDataContainerName)
const receiptsContainer = db.container(dbConfig.receiptsContainerName)
const usersContainer = db.container(dbConfig.usersContainerName)

module.exports = {
  messagesContainer,
  receiptsContainer,
  refDataContainer,
  usersContainer
}
