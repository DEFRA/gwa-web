const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../../test-env-vars')

describe('Uploading user data', () => {
  jest.mock('../../../../server/config')
  const config = require('../../../../server/config')
  config.dataSourcesContainer = dataSourcesContainer
  config.dataSourcesStorageConnectionString = dataSourcesStorageConnectionString

  let mockUpload
  const mockBlockBlobClient = jest.fn(() => {
    return { upload: mockUpload }
  })
  jest.mock('@azure/storage-blob', () => {
    return { BlockBlobClient: mockBlockBlobClient }
  })

  let uploadUserData

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    uploadUserData = require('../../../../server/lib/data/upload-user-data')
  })

  const users = [{ id: '1' }]
  const orgCode = 'ABC'

  test('file is uploaded correctly', async () => {
    mockUpload = jest.fn().mockImplementation(() => { return { errorCode: undefined } })
    mockBlockBlobClient.prototype.upload = mockUpload

    const res = await uploadUserData(users, orgCode)

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)
    expect(mockUpload).toHaveBeenCalledTimes(1)
    const data = JSON.stringify(users)
    expect(mockUpload).toHaveBeenCalledWith(data, data.length, { blobHTTPHeaders: { blobContentType: 'application/json' } })
    expect(res).toBe(true)
  })

  test('error code returned from upload returns function as false', async () => {
    mockUpload = jest.fn().mockImplementation(() => { return { errorCode: 'not undefined' } })
    mockBlockBlobClient.prototype.upload = mockUpload

    const res = await uploadUserData(users, orgCode)

    expect(res).toBe(false)
  })
})
