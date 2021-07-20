const { contactListContainer, contactListStorageConnectionString } = require('../../../test-env-vars')

describe('Uploading contact list', () => {
  jest.mock('../../../../server/config')
  const config = require('../../../../server/config')
  config.contactListContainer = contactListContainer
  config.contactListStorageConnectionString = contactListStorageConnectionString

  let mockUpload
  const mockBlockBlobClient = jest.fn(() => { return { upload: mockUpload } })
  jest.mock('@azure/storage-blob', () => { return { BlockBlobClient: mockBlockBlobClient } })

  let uploadContactList

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    uploadContactList = require('../../../../server/lib/data/upload-contact-list')
  })

  test('file is uploaded correctly', async () => {
    mockUpload = jest.fn().mockImplementation(() => { return { errorCode: undefined } })
    mockBlockBlobClient.prototype.upload = mockUpload
    const contacts = [{ phoneNumber: '07777111222' }]
    const text = 'nice to meet you'
    const messageId = '8be12e37-880b-4775-a6d0-a02d9d6c038c'
    const message = { contacts, id: messageId, text }

    const res = await uploadContactList(message)

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(contactListStorageConnectionString, contactListContainer, `${messageId}.json`)
    expect(mockUpload).toHaveBeenCalledTimes(1)
    const data = JSON.stringify({
      contacts: contacts.map(c => { return { phoneNumber: c } }),
      message: { id: messageId, text }
    })
    expect(mockUpload).toHaveBeenCalledWith(data, data.length, { blobHTTPHeaders: { blobContentType: 'application/json' } })
    expect(res).toBe(true)
  })

  test('error code returned from upload returns function as false', async () => {
    mockUpload = jest.fn().mockImplementation(() => { return { errorCode: 'not undefined' } })
    mockBlockBlobClient.prototype.upload = mockUpload
    const message = { contacts: [], id: 'my-id', text: 'text goes here' }

    const res = await uploadContactList(message)

    expect(res).toBe(false)
  })
})
