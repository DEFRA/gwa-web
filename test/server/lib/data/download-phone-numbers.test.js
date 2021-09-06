const mockDownloadFn = require('../../../helpers/mock-download')
const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../../../server/config')
const { phoneNumbersFilename } = require('../../../../server/constants')

describe('Downloading phone numbers', () => {
  let mockDownload
  let mockExists
  const mockBlockBlobClient = jest.fn(() => {
    return { download: mockDownload, exists: mockExists }
  })
  jest.mock('@azure/storage-blob', () => { return { BlockBlobClient: mockBlockBlobClient } })

  let downloadPhoneNumbers

  beforeEach(() => {
    jest.clearAllMocks()

    downloadPhoneNumbers = require('../../../../server/lib/data/download-phone-numbers')
  })

  test.each([
    { encoding: 'utf8' },
    { encoding: null }
  ])('file is downloaded correctly', async ({ encoding }) => {
    const fileContents = 'phone number\n07700 111111'
    mockDownload = jest.fn().mockResolvedValue(mockDownloadFn(fileContents, encoding))
    mockBlockBlobClient.prototype.download = mockDownload
    mockExists = jest.fn().mockResolvedValue(true)
    mockBlockBlobClient.prototype.exists = mockExists

    const res = await downloadPhoneNumbers()

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(phoneNumbersStorageConnectionString, phoneNumbersContainer, phoneNumbersFilename)
    expect(res).toEqual(fileContents)
  })

  test('undefined is returned when no file exists', async () => {
    mockExists = jest.fn().mockResolvedValue(false)
    mockBlockBlobClient.prototype.exists = mockExists

    const res = await downloadPhoneNumbers()

    expect(res).toBeUndefined()
  })
})
