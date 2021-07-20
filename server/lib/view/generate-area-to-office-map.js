const { referenceData } = require('../../constants')
const generateOfficeCode = require('./generate-office-code')

function sortAreas (areaGroupedOfficeMap) {
  return [...areaGroupedOfficeMap.values()].sort((o1, o2) => {
    if (o1.areaCode < o2.areaCode) { return -1 }
    if (o1.areaCode > o2.areaCode) { return 1 }
    return 0
  })
}

function sortOfficeLocations (areaGroupedOfficeMap) {
  areaGroupedOfficeMap.forEach(area => area.officeLocations.sort((o1, o2) => {
    if (o1.officeCode < o2.officeCode) { return -1 }
    if (o1.officeCode > o2.officeCode) { return 1 }
    return 0
  }))
}

function mapOfficeLocationsToAreas (officeLocationList) {
  const areaGroupedOfficeMap = new Map()

  officeLocationList.forEach(ol => {
    const areaCode = ol.areaCode
    const area = areaGroupedOfficeMap.get(areaCode)
    const office = { officeCode: generateOfficeCode(ol), officeLocation: ol.officeLocation }
    if (area) {
      // Ensure no officeCodes are duplicated
      const officeLocations = area.officeLocations.get(office.officeCode)
      if (!officeLocations) {
        area.officeLocations.set(office.officeCode, office)
      }
    } else {
      areaGroupedOfficeMap.set(areaCode, { areaCode, areaName: ol.areaName, officeLocations: new Map([[office.officeCode, office]]) })
    }
  })
  // Finished with the map
  areaGroupedOfficeMap.forEach(area => {
    area.officeLocations = [...area.officeLocations.values()]
  })
  return areaGroupedOfficeMap
}

module.exports = officeLocationList => {
  const id = referenceData.areaToOfficeMap

  const areaGroupedOfficeMap = mapOfficeLocationsToAreas(officeLocationList)

  sortOfficeLocations(areaGroupedOfficeMap)

  const areaToOfficeMapSorted = sortAreas(areaGroupedOfficeMap)

  return { id, data: areaToOfficeMapSorted }
}
