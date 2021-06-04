describe('Uploading contact list', () => {
  let BlockBlobClient
  const contactListContainer = 'contactListContainer'
  const contactListStorageConnectionString = 'contactListStorageConnectionString'
  let uploadMock
  let uploadContactList

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    BlockBlobClient = require('@azure/storage-blob').BlockBlobClient
    jest.mock('@azure/storage-blob')

    const config = require('../config')
    jest.mock('../config')
    config.contactListContainer = contactListContainer
    config.contactListStorageConnectionString = contactListStorageConnectionString

    uploadContactList = require('./upload-contact-list')
  })

  test('file is uploaded correctly', async () => {
    uploadMock = jest.fn().mockImplementation(() => { return { errorCode: undefined } })
    BlockBlobClient.prototype.upload = uploadMock
    const contacts = []
    const text = 'nice to meet you'
    const message = { contacts, id: 'your-id', text }

    const res = await uploadContactList(message)

    expect(BlockBlobClient).toHaveBeenCalledTimes(1)
    expect(BlockBlobClient).toHaveBeenCalledWith(contactListStorageConnectionString, contactListContainer, `${message.id}.json`)
    expect(uploadMock).toHaveBeenCalledTimes(1)
    const data = JSON.stringify({
      contacts: contacts.map(c => { return { phoneNumber: c } }),
      message: text
    })
    expect(uploadMock).toHaveBeenCalledWith(data, data.length, { blobHTTPHeaders: { blobContentType: 'application/json' } })
    expect(res).toBe(true)
  })

  test('error code returned from upload returns function as false', async () => {
    uploadMock = jest.fn().mockImplementation(() => { return { errorCode: 'not undefined' } })
    BlockBlobClient.prototype.upload = uploadMock
    const message = { contacts: [], id: 'my-id', text: 'text goes here' }

    const res = await uploadContactList(message)

    expect(res).toBe(false)
  })
})
