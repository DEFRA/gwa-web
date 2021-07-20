describe('Generating area to office map', () => {
  const generateAreaToOfficeMap = require('../../../../server/lib/view/generate-area-to-office-map')
  const { referenceData } = require('../../../../server/constants')
  const generateOfficeCode = require('../../../../server/lib/view/generate-office-code')

  const officeLocation = 'officeLocation'
  const areaCode = 'ABC'
  const areaName = 'areaName'
  const office = { officeLocation, areaCode, areaName }

  test('single office location is mapped to area', () => {
    const officeLocationList = [office]

    const res = generateAreaToOfficeMap(officeLocationList)

    expect(res).toHaveProperty('id')
    expect(res.id).toEqual(referenceData.areaToOfficeMap)
    expect(res).toHaveProperty('data')
    expect(res.data).toHaveLength(1)
    const area = res.data[0]
    expect(area).toHaveProperty('areaCode')
    expect(area.areaCode).toEqual(areaCode)
    expect(area).toHaveProperty('areaName')
    expect(area.areaName).toEqual(areaName)
    expect(area).toHaveProperty('officeLocations')
    const officeLocations = area.officeLocations
    expect(officeLocations).toHaveLength(1)
    expect(officeLocations[0]).toHaveProperty('officeCode')
    expect(officeLocations[0].officeCode).toEqual(generateOfficeCode(office))
    expect(officeLocations[0]).toHaveProperty('officeLocation')
    expect(officeLocations[0].officeLocation).toEqual(officeLocation)
  })

  test('several office locations are mapped to area', () => {
    const officeLocationTwo = 'officeLocationTwo'
    const officeTwo = { officeLocation: officeLocationTwo, areaCode, areaName }
    const officeLocationList = [office, officeTwo]

    const res = generateAreaToOfficeMap(officeLocationList)

    expect(res.id).toEqual(referenceData.areaToOfficeMap)
    expect(res.data).toHaveLength(1)
    const area = res.data[0]
    expect(area.areaCode).toEqual(areaCode)
    expect(area.areaName).toEqual(areaName)
    const officeLocations = area.officeLocations
    expect(officeLocations).toHaveLength(2)
    expect(officeLocations[0].officeCode).toEqual(generateOfficeCode(office))
    expect(officeLocations[0].officeLocation).toEqual(officeLocation)
    expect(officeLocations[1].officeCode).toEqual(generateOfficeCode(officeTwo))
    expect(officeLocations[1].officeLocation).toEqual(officeLocationTwo)
  })

  test('office locations with different areas are mapped correctly', () => {
    const areaCodeTwo = 'DEF'
    const areaNameTwo = 'areaNameTwo'
    const officeLocationTwo = 'officeLocationTwo'
    const officeTwo = { officeLocation: officeLocationTwo, areaCode: areaCodeTwo, areaName: areaNameTwo }
    const officeLocationList = [office, officeTwo]

    const res = generateAreaToOfficeMap(officeLocationList)

    expect(res.id).toEqual(referenceData.areaToOfficeMap)
    expect(res.data).toHaveLength(2)
    const areaOne = res.data[0]
    expect(areaOne.areaCode).toEqual(areaCode)
    expect(areaOne.areaName).toEqual(areaName)
    const officeLocationsOne = areaOne.officeLocations
    expect(officeLocationsOne).toHaveLength(1)
    expect(officeLocationsOne[0].officeCode).toEqual(generateOfficeCode(office))
    expect(officeLocationsOne[0].officeLocation).toEqual(officeLocation)
    const areaTwo = res.data[1]
    expect(areaTwo.areaCode).toEqual(areaCodeTwo)
    expect(areaTwo.areaName).toEqual(areaNameTwo)
    const officeLocationsTwo = areaTwo.officeLocations
    expect(officeLocationsTwo).toHaveLength(1)
    expect(officeLocationsTwo[0].officeCode).toEqual(generateOfficeCode(officeTwo))
    expect(officeLocationsTwo[0].officeLocation).toEqual(officeLocationTwo)
  })

  test('office locations are sorted within area', () => {
    const officeLocationTwo = 'officeLocationTwo'
    const officeLocationThree = 'aOfficeLocationThree'
    const officeTwo = { officeLocation: officeLocationTwo, areaCode, areaName }
    const officeThree = { officeLocation: officeLocationThree, areaCode, areaName }
    const officeLocationList = [office, officeTwo, officeThree]

    const res = generateAreaToOfficeMap(officeLocationList)

    expect(res.id).toEqual(referenceData.areaToOfficeMap)
    expect(res.data).toHaveLength(1)
    const area = res.data[0]
    expect(area.areaCode).toEqual(areaCode)
    expect(area.areaName).toEqual(areaName)
    const officeLocations = area.officeLocations
    expect(officeLocations).toHaveLength(3)
    expect(officeLocations[0].officeCode).toEqual(generateOfficeCode(officeThree))
    expect(officeLocations[0].officeLocation).toEqual(officeLocationThree)
    expect(officeLocations[1].officeCode).toEqual(generateOfficeCode(office))
    expect(officeLocations[1].officeLocation).toEqual(officeLocation)
    expect(officeLocations[2].officeCode).toEqual(generateOfficeCode(officeTwo))
    expect(officeLocations[2].officeLocation).toEqual(officeLocationTwo)
  })

  test('office locations are not duplicated within areas', () => {
    const officeTwo = { officeLocation, areaCode, areaName }
    const officeThree = { officeLocation, areaCode, areaName }
    const officeLocationList = [office, officeTwo, officeThree]

    const res = generateAreaToOfficeMap(officeLocationList)

    expect(res.id).toEqual(referenceData.areaToOfficeMap)
    expect(res.data).toHaveLength(1)
    const area = res.data[0]
    expect(area.areaCode).toEqual(areaCode)
    expect(area.areaName).toEqual(areaName)
    const officeLocations = area.officeLocations
    expect(officeLocations).toHaveLength(1)
    expect(officeLocations[0].officeCode).toEqual(generateOfficeCode(officeThree))
    expect(officeLocations[0].officeLocation).toEqual(officeLocation)
  })

  test('areas are sorted', () => {
    const areaCodeTwo = 'XYZ'
    const areaNameTwo = 'areaNameTwo'
    const areaCodeThree = 'DEF'
    const areaNameThree = 'areaNameTwo'
    const officeTwo = { officeLocation, areaCode: areaCodeTwo, areaName: areaNameTwo }
    const officeThree = { officeLocation, areaCode: areaCodeThree, areaName: areaNameThree }
    const officeLocationList = [office, officeTwo, officeThree]

    const res = generateAreaToOfficeMap(officeLocationList)

    expect(res.id).toEqual(referenceData.areaToOfficeMap)
    expect(res.data).toHaveLength(3)
    const areaOne = res.data[0]
    expect(areaOne.areaCode).toEqual(areaCode)
    expect(areaOne.areaName).toEqual(areaName)
    const areaTwo = res.data[1]
    expect(areaTwo.areaCode).toEqual(areaCodeThree)
    expect(areaTwo.areaName).toEqual(areaNameThree)
    const areaThree = res.data[2]
    expect(areaThree.areaCode).toEqual(areaCodeTwo)
    expect(areaThree.areaName).toEqual(areaNameTwo)
  })
})
