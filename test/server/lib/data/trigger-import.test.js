const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../../test-env-vars')

describe('Triggering import', () => {
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

  let triggerImport
  const now = Date.now()
  Date.now = jest.fn(() => now)

  beforeEach(() => {
    jest.clearAllMocks()

    triggerImport = require('../../../../server/lib/data/trigger-import')
  })

  test('file is uploaded correctly', async () => {
    mockUpload = jest.fn().mockImplementation(() => { return { errorCode: undefined } })
    mockBlockBlobClient.prototype.upload = mockUpload

    const res = await triggerImport()

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(dataSourcesStorageConnectionString, dataSourcesContainer, 'trigger.json')
    expect(mockUpload).toHaveBeenCalledTimes(1)
    const data = JSON.stringify({ now: now.toString() })
    expect(mockUpload).toHaveBeenCalledWith(data, data.length, { blobHTTPHeaders: { blobContentType: 'application/json' } })
    expect(res).toBe(true)
  })

  test('error code returned from upload returns function as false', async () => {
    mockUpload = jest.fn().mockImplementation(() => { return { errorCode: 'not undefined' } })
    mockBlockBlobClient.prototype.upload = mockUpload

    const res = await triggerImport()

    expect(res).toBe(false)
  })
})
