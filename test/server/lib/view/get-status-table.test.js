const { dataExtractContainer, dataExtractStorageConnectionString, dataSourcesContainer, dataSourcesStorageConnectionString, phoneNumbersContainer, phoneNumbersFile, phoneNumbersStorageConnectionString } = require('../../../../server/config')

describe('Getting system status table', () => {
  const { formatDate } = require('../../../../server/lib/misc/helpers')
  const getStatusTable = require('../../../../server/lib/view/get-status-table')

  jest.mock('../../../../server/lib/data/get-container-blobs')
  const getContainerBlobs = require('../../../../server/lib/data/get-container-blobs')

  test('request to get data is correct', async () => {
    getContainerBlobs.mockResolvedValue([])

    await getStatusTable()

    expect(getContainerBlobs).toHaveBeenCalledTimes(3)
    expect(getContainerBlobs).toHaveBeenNthCalledWith(1, dataExtractStorageConnectionString, dataExtractContainer)
    expect(getContainerBlobs).toHaveBeenNthCalledWith(2, dataSourcesStorageConnectionString, dataSourcesContainer)
    expect(getContainerBlobs).toHaveBeenNthCalledWith(3, phoneNumbersStorageConnectionString, phoneNumbersContainer)
  })

  test('table has head and rows', async () => {
    getContainerBlobs.mockResolvedValue([])

    const table = await getStatusTable()

    expect(table).toHaveProperty('head')
    expect(table.head).toEqual([{ text: 'Data item' }, { text: 'File' }, { text: 'Last modified' }])
    expect(table).toHaveProperty('rows')
    expect(table.rows).toEqual([])
  })

  function createMockFileResponse (name) {
    return { name, properties: { lastModified: Date.now() } }
  }

  test('rows for data extract files are correct', async () => {
    const aadFile = createMockFileResponse('aad-users.json')
    const awFile = createMockFileResponse('aw-users.json')
    const files = [aadFile, awFile]
    getContainerBlobs.mockResolvedValueOnce(files)
    getContainerBlobs.mockResolvedValueOnce([])
    getContainerBlobs.mockResolvedValueOnce([])

    const table = await getStatusTable()

    expect(table.rows).toHaveLength(files.length)
    expect(table.rows[0][0].text).toEqual('Azure Active Directory extract')
    expect(table.rows[0][1].text).toEqual(aadFile.name)
    expect(table.rows[0][2].text).toEqual(formatDate(aadFile.properties.lastModified))
    expect(table.rows[1][0].text).toEqual('AirWatch extract')
    expect(table.rows[1][1].text).toEqual(awFile.name)
    expect(table.rows[1][2].text).toEqual(formatDate(awFile.properties.lastModified))
  })

  test('rows for data source files are correct', async () => {
    const internalUsersFiles = createMockFileResponse('internal-users.json')
    const albAbcFile = createMockFileResponse('ABC.json')
    const albXyzFile = createMockFileResponse('XYZ.json')
    const files = [internalUsersFiles, albAbcFile, albXyzFile]
    getContainerBlobs.mockResolvedValueOnce([])
    getContainerBlobs.mockResolvedValueOnce(files)
    getContainerBlobs.mockResolvedValueOnce([])

    const table = await getStatusTable()

    expect(table.rows).toHaveLength(files.length - 1)
    expect(table.rows[0][0].text).toEqual(`Upload for ${albAbcFile.name.replace('.json', '')} (ALB)`)
    expect(table.rows[0][1].text).toEqual(albAbcFile.name)
    expect(table.rows[0][2].text).toEqual(formatDate(albAbcFile.properties.lastModified))
    expect(table.rows[1][0].text).toEqual(`Upload for ${albXyzFile.name.replace('.json', '')} (ALB)`)
    expect(table.rows[1][1].text).toEqual(albXyzFile.name)
    expect(table.rows[1][2].text).toEqual(formatDate(albXyzFile.properties.lastModified))
  })

  test('rows for phone numer files are correct', async () => {
    const phoneNumbersFileRes = createMockFileResponse(phoneNumbersFile)
    const files = [phoneNumbersFileRes]
    getContainerBlobs.mockResolvedValueOnce([])
    getContainerBlobs.mockResolvedValueOnce([])
    getContainerBlobs.mockResolvedValueOnce(files)

    const table = await getStatusTable()

    expect(table.rows).toHaveLength(files.length)
    expect(table.rows[0][0].text).toEqual('Phone number list')
    expect(table.rows[0][1].text).toEqual(phoneNumbersFileRes.name)
    expect(table.rows[0][2].text).toEqual(formatDate(phoneNumbersFileRes.properties.lastModified))
  })
})
