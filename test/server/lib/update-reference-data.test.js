const { typeInfo, types } = require('../../../server/lib/reference-data')

const { updateReferenceData: mockUpdateReferenceData } = require('../../../server/lib/db')
jest.mock('../../../server/lib/db')
const generateAreaToOfficeMap = require('../../../server/lib/generate-area-to-office-map')
jest.mock('../../../server/lib/generate-area-to-office-map')

describe('Updating reference data', () => {
  const updateReferenceData = require('../../../server/lib/update-reference-data')
  const successResponse = { status: 200 }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateReferenceData.mockResolvedValue(successResponse)
  })

  test.each([
    [types.orgList],
    [types.orgMap]
  ])('reference data item is updated when type is found', async (type) => {
    const data = [{ a: 1 }]

    const response = await updateReferenceData(data, type)

    expect(response).toEqual(successResponse)
    expect(mockUpdateReferenceData).toHaveBeenCalledTimes(1)
    expect(mockUpdateReferenceData).toHaveBeenCalledWith({
      id: typeInfo[type].id,
      data
    })
  })

  test('areaToOfficeMap is generated and updated when type is `officeLocations`', async () => {
    const mockAreaToOfficeMap = { id: 'areaToOfficeMapId', data: [{ id: 1 }] }
    generateAreaToOfficeMap.mockReturnValue(mockAreaToOfficeMap)
    const data = [{ a: 1 }]

    const response = await updateReferenceData(data, types.officeLocations)

    expect(response).toEqual(successResponse)
    expect(generateAreaToOfficeMap).toHaveBeenCalledTimes(1)
    expect(generateAreaToOfficeMap).toHaveBeenCalledWith(data)
    expect(mockUpdateReferenceData).toHaveBeenCalledTimes(2)
    expect(mockUpdateReferenceData).toHaveBeenNthCalledWith(1, mockAreaToOfficeMap)
    expect(mockUpdateReferenceData).toHaveBeenNthCalledWith(2, {
      id: typeInfo[types.officeLocations].id,
      data
    })
  })

  test.each([
    [403, 500],
    [503, 404]
  ])('when type is `officeLocations` highest status code is returned', async (statusOne, statusTwo) => {
    mockUpdateReferenceData.mockResolvedValueOnce({ status: statusOne }).mockResolvedValueOnce({ status: statusTwo })
    const mockAreaToOfficeMap = { id: 'areaToOfficeMapId', data: [{ id: 1 }] }
    generateAreaToOfficeMap.mockReturnValue(mockAreaToOfficeMap)
    const data = [{ a: 1 }]

    const response = await updateReferenceData(data, types.officeLocations)

    expect(response).toEqual({ status: statusOne > statusTwo ? statusOne : statusTwo })
    expect(generateAreaToOfficeMap).toHaveBeenCalledTimes(1)
    expect(generateAreaToOfficeMap).toHaveBeenCalledWith(data)
    expect(mockUpdateReferenceData).toHaveBeenCalledTimes(2)
    expect(mockUpdateReferenceData).toHaveBeenNthCalledWith(1, mockAreaToOfficeMap)
    expect(mockUpdateReferenceData).toHaveBeenNthCalledWith(2, {
      id: typeInfo[types.officeLocations].id,
      data
    })
  })

  test('error is thrown when when type is not found', async () => {
    const data = [{ a: 1 }]
    const type = 'unknown'

    expect.assertions(1)
    await expect(updateReferenceData(data, type)).rejects.toThrow(`Unknown reference data type: ${type}.`)
  })
})
