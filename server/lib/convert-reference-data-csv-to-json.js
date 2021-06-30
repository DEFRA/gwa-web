const csvtojson = require('csvtojson')
const { typeInfo, types } = require('./reference-data')
const generateOfficeCode = require('./generate-office-code')

/**
 * Convert a readableStream of a CSV file containing reference data into JSON.
 * CSV header is required and will be used to check the columns are correct and
 * as expected based on the `type`.
 *
 * @param {Stream} readableStream CSV file of reference data.
 * @param {string} type type of data and determines conversion attempted.
 * @returns {object} containing `data` - an array of the parsed reference data
 * and `valid` - a boolean indicating if the file was deemed OK.
 */
module.exports = async (readableStream, type) => {
  let data
  try {
    switch (type) {
      case types.officeLocations:
        data = await csvtojson()
          .fromStream(readableStream)
          .subscribe(line => {
            line.officeCode = generateOfficeCode(line)
          })
        break
      case types.orgList:
        data = (await csvtojson({
          colParser: {
            active: item => item.toLowerCase() === 'true',
            core: item => item.toLowerCase() === 'true'
          }
        })
          .fromStream(readableStream))
          .filter(x => x.orgCode !== 'UFD')
          .concat({ orgName: 'Undefined', orgCode: 'UFD', active: true, core: false })
        break
      case types.orgMap:
        data = await csvtojson().fromStream(readableStream)
        break
      default:
        throw new Error(`Unknown reference data type: ${type}.`)
    }
  } catch (err) {
    console.error(err)
    return { valid: false }
  }
  return {
    data,
    valid: data[0] ? Object.getOwnPropertyNames(data[0]).join() === typeInfo[type].headers.join() : false
  }
}
