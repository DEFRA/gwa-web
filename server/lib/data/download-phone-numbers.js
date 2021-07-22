const { BlockBlobClient } = require('@azure/storage-blob')
const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../config')

async function streamToBuffer (readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', data => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data))
    })
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    readableStream.on('error', reject)
  })
}

module.exports = async () => {
  const client = new BlockBlobClient(phoneNumbersStorageConnectionString, phoneNumbersContainer, 'phone-numbers.csv')
  const downloadBlobResponse = await client.download()
  return (await streamToBuffer(downloadBlobResponse.readableStreamBody)).toString()
}
