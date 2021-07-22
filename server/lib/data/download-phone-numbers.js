const { BlockBlobClient } = require('@azure/storage-blob')
const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../config')
const streamToBuffer = require('../misc/stream-to-buffer')

module.exports = async () => {
  const client = new BlockBlobClient(phoneNumbersStorageConnectionString, phoneNumbersContainer, 'phone-numbers.csv')
  const downloadBlobResponse = await client.download()
  return (await streamToBuffer(downloadBlobResponse.readableStreamBody)).toString()
}
