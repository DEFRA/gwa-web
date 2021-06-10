const { BlockBlobClient } = require('@azure/storage-blob')
const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../config')

/**
 * Uploads a JSON file to the 'contact-list' blob storage container. The file
 * includes the text of the message and the list of contact phone numbers to
 * send the message to.
 *
 * @param {object} users list of users.
 * @param {string} orgCode organisation code to name the file with.
 * @returns {boolean} represents success of upload.
 */
module.exports = async (users, orgCode) => {
  const data = JSON.stringify(users)
  const client = new BlockBlobClient(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)
  const res = await client.upload(data, data.length, { blobHTTPHeaders: { blobContentType: 'application/json' } })
  return res.errorCode === undefined
}
