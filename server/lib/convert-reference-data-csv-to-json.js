const csvtojson = require('csvtojson')
const { typeInfo, types } = require('./reference-data')
const generateOfficeCode = require('./generate-office-code')

function validateOrgList (data, orgList) {
  const orgMap = new Map(orgList.map(x => [x.orgCode, { orgName: x.orgName }]))
  for (const item of data) {
    const org = orgMap.get(item.orgCode)
    if (org) {
      item.orgName = org.orgName
    } else {
      return false
    }
  }
  return true
}

function isValid (data, type) {
  return data[0] ? Object.getOwnPropertyNames(data[0]).join() === typeInfo[type].headers.join() : false
}
/**
 * Convert a readableStream of a CSV file containing reference data into JSON
 * that is able to replace the existing instance of the reference data.
 * CSV header is required and will be used to validate the columns are correct
 * and as expected based on the `type`.
 *
 * @param {Stream} readableStream CSV file of reference data.
 * @param {string} type type of data, determining conversion attempted.
 * @param {object} db object reference to `request.server.methods.db`.
 * @returns {object} containing `data` - an array of the parsed reference data
 * if the input was valid or undefined if not valid. And `valid` - a boolean
 * indicating if the file was deemed OK.
 */
module.exports = async (readableStream, type, db) => {
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
      case types.orgMap: {
        const orgList = await db.getOrganisationList()
        data = await csvtojson().fromStream(readableStream)
        if (!validateOrgList(data, orgList)) {
          return { valid: false }
        }
        break
      }
      default:
        throw new Error(`Unknown reference data type: ${type}.`)
    }
  } catch (err) {
    return { valid: false }
  }
  return {
    data,
    valid: isValid(data, type)
  }
}
