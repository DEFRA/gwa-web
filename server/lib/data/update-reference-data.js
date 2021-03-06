const { updateReferenceData } = require('../db')
const generateAreaToOfficeMap = require('../view/generate-area-to-office-map')
const { typeInfo, types } = require('../view/reference-data')

/**
 * Updates the reference data item (and any associated items) in the DB based
 * on the `type` of data. If no type is matched an error is thrown.
 *
 * @param {object} data the reference data item.
 * @param {string} type the type of the reference data item.
 * @returns {object} Either a promise representing an
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 * or a resolved `ItemResponse`.
 */
module.exports = async (data, type) => {
  const typeData = typeInfo[type]
  if (!typeData) {
    throw new Error(`Unknown reference data type: ${type}.`)
  }

  if (type === types.officeLocations) {
    const areaToOfficeMapItem = generateAreaToOfficeMap(data)
    const res = await Promise.all([
      updateReferenceData(areaToOfficeMapItem),
      updateReferenceData({ id: typeData.id, data })
    ])
    return res.sort((a, b) => {
      if (a.status > b.status) { return -1 }
      if (a.status < b.status) { return 1 }
      return 0
    })[0]
  }
  return updateReferenceData({ id: typeData.id, data })
}
