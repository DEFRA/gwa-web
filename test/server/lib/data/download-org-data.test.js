const mockDownloadFn = require('../../../helpers/mock-download')
const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../../../server/config')

describe('Download org data', () => {
  let mockDownload
  let mockExists
  const mockBlockBlobClient = jest.fn(() => {
    return { download: mockDownload, exists: mockExists }
  })
  jest.mock('@azure/storage-blob', () => {
    return { BlockBlobClient: mockBlockBlobClient }
  })

  let downloadOrgData

  beforeEach(() => {
    jest.clearAllMocks()

    downloadOrgData = require('../../../../server/lib/data/download-org-data')
  })

  const orgCode = 'ABC'

  test.each([
    { encoding: 'utf8' },
    { encoding: null }
  ])('file is downloaded when it exists', async ({ encoding }) => {
    const fileContents = 'something'
    mockDownload = jest.fn().mockResolvedValue(mockDownloadFn(fileContents, encoding))
    mockBlockBlobClient.prototype.download = mockDownload
    mockExists = jest.fn().mockResolvedValue(true)
    mockBlockBlobClient.prototype.exists = mockExists

    const res = await downloadOrgData(orgCode)

    expect(mockBlockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlockBlobClient).toHaveBeenCalledWith(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)
    expect(mockExists).toHaveBeenCalledTimes(1)
    expect(mockDownload).toHaveBeenCalledTimes(1)
    expect(res).toEqual(fileContents)
  })

  test('undefined is returned when no file exists', async () => {
    mockExists = jest.fn().mockResolvedValue(false)
    mockBlockBlobClient.prototype.exists = mockExists

    const res = await downloadOrgData(orgCode)

    expect(res).toBeUndefined()
  })
})
