const { BlockBlobClient } = require('@azure/storage-blob')
const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../config')

/**
 * Uploads a file to the 'data-sources' blob storage container. The sole
 * purpose of this is to trigger the `ImportData` function to run, thereby
 * keeping the user data in sync with elements of the reference data.
 * The file uploaded is named `trigger.json` and it contains an object with a
 * `now` property containing `Date.now()`.
 *
 * @returns {boolean} represents success of upload.
 */
module.exports = async () => {
  const data = JSON.stringify({ now: Date.now().toString() })
  const client = new BlockBlobClient(dataSourcesStorageConnectionString, dataSourcesContainer, 'trigger.json')
  const res = await client.upload(data, data.length, { blobHTTPHeaders: { blobContentType: 'application/json' } })
  return res.errorCode === undefined
}
