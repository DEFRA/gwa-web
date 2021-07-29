const { ContainerClient } = require('@azure/storage-blob')

/**
 * Gets the blobs from the specified container, returning an array of
 * [BlobItem](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-storage-blob/12.6.0/interfaces/blobitem.html).
 *
 * @param {connectionString} used instantiate the `ContainerClient`.
 * @param {container} used instantiate the `ContainerClient`.
 * @returns {Array} representing the `BlobItem`s in the container.
 */
module.exports = async (connectionString, container) => {
  const client = new ContainerClient(connectionString, container)
  const blobs = []
  for await (const blob of client.listBlobsFlat()) {
    blobs.push(blob)
  }
  return blobs
}
