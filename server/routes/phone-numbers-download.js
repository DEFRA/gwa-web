const { BlockBlobClient } = require('@azure/storage-blob')
const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../config')

const { scopes } = require('../permissions')

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

module.exports = [
  {
    method: 'GET',
    path: '/phone-numbers-download',
    handler: async (request, h) => {
      const client = new BlockBlobClient(phoneNumbersStorageConnectionString, phoneNumbersContainer, 'phone-numbers.csv')
      const downloadBlobResponse = await client.download()
      const blobContents = (await streamToBuffer(downloadBlobResponse.readableStreamBody)).toString()

      return h.response(blobContents).header('Content-Type', 'text/csv')
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.message.manage}`]
        }
      }
    }
  }
]
