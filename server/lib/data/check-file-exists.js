const { BlockBlobClient } = require('@azure/storage-blob')

/**
 * Checks if the file exists in the container using the provided
 * connectionString.
 *
 * @param {string} connectionString.
 * @param {string} container where file is located.
 * @param {string} file to attempt to download.
 * @returns {boolean} represents the existance of the file.
 */
module.exports = async (connectionString, container, file) => {
  const client = new BlockBlobClient(connectionString, container, file)

  return client.exists()
}
