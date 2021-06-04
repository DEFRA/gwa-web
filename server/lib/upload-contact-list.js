const { BlockBlobClient } = require('@azure/storage-blob')
const { contactListContainer, contactListStorageConnectionString } = require('../config')

/**
 * Uploads a JSON file to the 'contact-list' blob storage container. The file
 * includes the text of the message and the list of contact phone numbers to
 * send the message to.
 *
 * @param {object} message containing a list of `contacts`, an `id` and the `text` of the message.
 * @returns {boolean} represents success of upload.
 */
module.exports = async (message) => {
  const { contacts, id, text } = message
  const data = JSON.stringify({
    contacts: contacts.map(c => { return { phoneNumber: c } }),
    message: text
  })
  const client = new BlockBlobClient(contactListStorageConnectionString, contactListContainer, `${id}.json`)
  const res = await client.upload(data, data.length, { blobHTTPHeaders: { blobContentType: 'application/json' } })
  return res.errorCode === undefined
}
