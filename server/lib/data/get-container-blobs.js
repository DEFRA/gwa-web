const { ContainerClient } = require('@azure/storage-blob')

module.exports = async (connectionString, container) => {
  const client = new ContainerClient(connectionString, container)
  const blobs = []
  for await (const blob of client.listBlobsFlat()) {
    blobs.push(blob)
  }
  return blobs
}
