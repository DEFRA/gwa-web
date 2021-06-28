const { typeInfo } = require('../../../server/lib/reference-data')
const types = Object.getOwnPropertyNames(typeInfo)

const mockResponse = { status: 200 }
const mockUpdateReferenceData = jest.fn().mockResolvedValue(mockResponse)
jest.mock('../../../server/lib/db', () => {
  return {
    updateReferenceData: mockUpdateReferenceData
  }
})

describe('Updating reference data', () => {
  const updateReferenceData = require('../../../server/lib/update-reference-data')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each(
    types
  )('reference data item is updated when type is found', async (type) => {
    const data = [{ a: 1 }]

    const response = await updateReferenceData(data, type)

    expect(response).toEqual(mockResponse)
    expect(mockUpdateReferenceData).toHaveBeenCalledTimes(1)
    expect(mockUpdateReferenceData).toHaveBeenCalledWith({
      id: typeInfo[type].id,
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
