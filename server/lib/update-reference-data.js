const { updateReferenceData } = require('./db')
const { typeInfo } = require('./reference-data')

/**
 * Updates the reference data item (and any associated items) in the DB based
 * on the `type` of data. If no type is matched an error is thrown.
 *
 * @param {object} data the reference data item.
 * @param {string} type the type of the reference data item.
 * @returns {Promise} Promise representing
 * [ItemResponse](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.10.6/classes/itemresponse.html)
 */
module.exports = async (data, type) => {
  const typeData = typeInfo[type]
  if (!typeData) {
    throw new Error(`Unknown reference data type: ${type}.`)
  }

  const referenceDataItem = {
    id: typeData.id,
    data
  }
  return updateReferenceData(referenceDataItem)
}
