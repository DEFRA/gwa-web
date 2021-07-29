describe('Getting container blobs', () => {
  let getContainerBlobs
  const connectionString = 'connection-string'
  const container = 'container'

  let mockListBlobsFlat
  const mockContainerClient = jest.fn(() => {
    return { listBlobsFlat: mockListBlobsFlat }
  })
  jest.mock('@azure/storage-blob', () => {
    return { ContainerClient: mockContainerClient }
  })

  beforeEach(() => {
    getContainerBlobs = require('../../../../server/lib/data/get-container-blobs')
  })

  test('container client is created correctly and returns empty array when there are no blobs', async () => {
    mockListBlobsFlat = async function * listBlobsFlatIterable () { }

    const blobs = await getContainerBlobs(connectionString, container)

    expect(mockContainerClient).toHaveBeenCalled()
    expect(mockContainerClient).toHaveBeenCalledWith(connectionString, container)
    expect(blobs).toEqual([])
  })

  test('blobs are returned when there are some', async () => {
    const mockFileOne = { name: 'mock-file-one' }
    const mockFileTwo = { name: 'mock-file-two' }
    mockListBlobsFlat = async function * listBlobsFlatIterable () {
      yield mockFileOne
      yield mockFileTwo
    }

    const blobs = await getContainerBlobs(connectionString, container)

    expect(mockContainerClient).toHaveBeenCalled()
    expect(mockContainerClient).toHaveBeenCalledWith(connectionString, container)
    expect(blobs).toHaveLength(2)
    expect(blobs[0].name).toEqual(mockFileOne.name)
    expect(blobs[1].name).toEqual(mockFileTwo.name)
  })
})
