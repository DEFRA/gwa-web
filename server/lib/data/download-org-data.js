const { BlockBlobClient } = require('@azure/storage-blob')
const streamToBuffer = require('../misc/stream-to-buffer')
const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../config')

/**
 * Downloads a JSON file from the `data-sources` blob storage container. The
 * file attempted to be downloaded is `{orgCode}.json`. If the file doesn't
 * exist `undefined` is returned.
 *
 * @param {string} orgCode organsation code of the file to download.
 * @returns {string} representing the content of the file or `undefined` if
 * there is no file.
 */
module.exports = async orgCode => {
  const client = new BlockBlobClient(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)

  if (await (client.exists())) {
    const downloadBlobResponse = await client.download()
    return (await streamToBuffer(downloadBlobResponse.readableStreamBody)).toString()
  } else {
    return undefined
  }
}
