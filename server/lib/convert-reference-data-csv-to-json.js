const csvtojson = require('csvtojson')
const { types } = require('./reference-data')

/**
 * Convert a readableStream of a CSV file containing reference data into JSON.
 * CSV header is required. Columns are mapped to properties based on the
 * `type`.
 *
 * @param {Stream} readableStream CSV file of reference data.
 * @param {string} type type of data and therefore conversion attempted.
 * @returns {Array} containing reference data.
 */
module.exports = async (readableStream, type) => {
  let data = []
  switch (type) {
    case types.officeLocations:
      data = await csvtojson({
        headers: ['originalOfficeLocation', 'officeLocation', 'areaCode', 'areaName', 'officeCode']
      }).fromStream(readableStream)
      break
    case types.orgList:
      data = await csvtojson({
        headers: ['orgName', 'orgCode', 'active', 'core'],
        colParser: {
          active: item => item.toLowerCase() === 'true',
          core: item => item.toLowerCase() === 'true'
        }
      }).fromStream(readableStream)
      break
    case types.orgMap:
      data = await csvtojson({
        headers: ['originalOrgName', 'orgName', 'orgCode']
      }).fromStream(readableStream)
      break
    default:
      break
  }
  return data
}
