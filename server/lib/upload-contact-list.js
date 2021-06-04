const { BlockBlobClient } = require('@azure/storage-blob')
const { contactListContainer, contactListStorageConnectionString } = require('../config')

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
