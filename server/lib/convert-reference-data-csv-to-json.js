const csvtojson = require('csvtojson')
const { types } = require('./reference-data')
const generateOfficeCode = require('./generate-office-code')

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
  switch (type) {
    case types.officeLocations:
      return await csvtojson({
        headers: ['originalOfficeLocation', 'officeLocation', 'areaCode', 'areaName', 'officeCode']
      })
        .fromStream(readableStream)
        .subscribe(line => {
          line.officeCode = generateOfficeCode(line)
        })
    case types.orgList: {
      return (await csvtojson({
        headers: ['orgName', 'orgCode', 'active', 'core'],
        colParser: {
          active: item => item.toLowerCase() === 'true',
          core: item => item.toLowerCase() === 'true'
        }
      })
        .fromStream(readableStream))
        .filter(x => x.orgCode !== 'UFD')
        .concat({ orgCode: 'UFD', orgName: 'Undefined', active: true, core: false })
    }
    case types.orgMap:
      return await csvtojson({
        headers: ['originalOrgName', 'orgName', 'orgCode']
      }).fromStream(readableStream)
    default:
      throw new Error(`Unknown reference data type: ${type}.`)
  }
}
