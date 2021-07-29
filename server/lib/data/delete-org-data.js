const { BlobClient } = require('@azure/storage-blob')
const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../config')

/**
 * Delete a JSON file from the `data-sources` blob storage container. The
 * file attempted to be deleted is `{orgCode}.json`. If the file is deleted
 * `true` is returned otherwise `false`.
 *
 * @param {string} orgCode organsation code of the file to delete.
 * @returns {boolean} representing the success of the file deletion.
 */
module.exports = async orgCode => {
  const client = new BlobClient(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)

  return (await client.deleteIfExists()).succeeded
}
