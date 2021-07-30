const { BlockBlobClient } = require('@azure/storage-blob')
const streamToBuffer = require('../misc/stream-to-buffer')

/**
 * Downloads the file from the provided container and connectionString.
 * If the file doesn't exist `undefined` is returned.
 *
 * @param {string} connectionString.
 * @param {string} container where file is located.
 * @param {string} file to attempt to download.
 * @returns {string} representing the content of the file or `undefined` if
 * there is no file.
 */
module.exports = async (connectionString, container, file) => {
  const client = new BlockBlobClient(connectionString, container, file)

  if (await client.exists()) {
    const downloadBlobResponse = await client.download()
    return (await streamToBuffer(downloadBlobResponse.readableStreamBody)).toString()
  }
  return undefined
}
