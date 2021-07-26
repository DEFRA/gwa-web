const mockDownloadFn = require('../../../helpers/mock-download')
const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../../test-env-vars')

describe('Downloading phone numbers', () => {
  jest.mock('../../../../server/config')
  const config = require('../../../../server/config')
  config.phoneNumbersContainer = phoneNumbersContainer
  config.phoneNumbersStorageConnectionString = phoneNumbersStorageConnectionString

  let mockDownload
  const mockBlockBlobClient = jest.fn(() => { return { download: mockDownload } })
  jest.mock('@azure/storage-blob', () => { return { BlockBlobClient: mockBlockBlobClient } })

  let downloadPhoneNumbers

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    downloadPhoneNumbers = require('../../../../server/lib/data/download-phone-numbers')
  })

  test.each([
    { encoding: 'utf8' },
    { encoding: null }
  ])('file is downloaded correctly', async ({ encoding }) => {
    const fileContents = 'phone number\n07700 111111'
    mockDownload = jest.fn().mockResolvedValue(mockDownloadFn(fileContents, encoding))
    mockBlockBlobClient.prototype.download = mockDownload

    const res = await downloadPhoneNumbers()

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(phoneNumbersStorageConnectionString, phoneNumbersContainer, 'phone-numbers.csv')
    expect(res).toEqual(fileContents)
  })
})
