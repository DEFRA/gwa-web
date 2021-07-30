const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../../../server/config')

describe('Delete org data', () => {
  let mockDeleteIfExists
  const mockBlobClient = jest.fn(() => {
    return { deleteIfExists: mockDeleteIfExists }
  })
  jest.mock('@azure/storage-blob', () => {
    return { BlobClient: mockBlobClient }
  })

  let deleteOrgData

  beforeEach(() => {
    jest.clearAllMocks()

    deleteOrgData = require('../../../../server/lib/data/delete-org-data')
  })

  const orgCode = 'ABC'

  test.each([
    { succeeded: true },
    { succeeded: false }
  ])('returns succeeded property value', async ({ succeeded }) => {
    mockDeleteIfExists = jest.fn().mockResolvedValue({ succeeded })
    mockBlobClient.prototype.exists = mockDeleteIfExists

    const res = await deleteOrgData(orgCode)

    expect(mockBlobClient).toHaveBeenCalledTimes(1)
    expect(mockBlobClient).toHaveBeenCalledWith(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)
    expect(mockDeleteIfExists).toHaveBeenCalledTimes(1)
    expect(res).toEqual(succeeded)
  })
})
