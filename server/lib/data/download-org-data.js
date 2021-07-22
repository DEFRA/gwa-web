const { BlockBlobClient } = require('@azure/storage-blob')
const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../config')
const streamToBuffer = require('../misc/stream-to-buffer')

module.exports = async orgCode => {
  const client = new BlockBlobClient(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)
  const downloadBlobResponse = await client.download()
  return (await streamToBuffer(downloadBlobResponse.readableStreamBody)).toString()
}
