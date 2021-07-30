describe('Check file exists', () => {
  const connectionString = 'connectionString'
  const container = 'container'
  const file = 'file'

  let mockExists
  const mockBlockBlobClient = jest.fn(() => {
    return { exists: mockExists }
  })
  jest.mock('@azure/storage-blob', () => {
    return { BlockBlobClient: mockBlockBlobClient }
  })

  let checkFileExists
  beforeEach(() => {
    jest.clearAllMocks()

    checkFileExists = require('../../../../server/lib/data/check-file-exists')
  })

  test('returns true when file exists', async () => {
    mockExists = jest.fn().mockResolvedValue(true)
    mockBlockBlobClient.prototype.exists = mockExists

    const fileExists = await checkFileExists(connectionString, container, file)

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(connectionString, container, file)
    expect(mockExists).toHaveBeenCalledTimes(1)
    expect(fileExists).toEqual(true)
  })

  test('returns false when file does not exist', async () => {
    mockExists = jest.fn().mockResolvedValue(false)
    mockBlockBlobClient.prototype.exists = mockExists

    const fileExists = await checkFileExists(connectionString, container, file)

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(connectionString, container, file)
    expect(mockExists).toHaveBeenCalledTimes(1)
    expect(fileExists).toEqual(false)
  })
})
