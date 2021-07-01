const csvtojson = require('csvtojson')
const { typeInfo, types } = require('./reference-data')
const generateOfficeCode = require('./generate-office-code')

function validateOrgs (data, orgList) {
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
 * or empty if not valid. And `valid` - a boolean indicating if the file was
 * deemed OK.
 */
module.exports = async (readableStream, type, db) => {
  let data = []
  let valid
  try {
    switch (type) {
      case types.officeLocations:
        data = await csvtojson()
          .fromStream(readableStream)
          .subscribe(line => {
            line.officeCode = generateOfficeCode(line)
          })

        valid = isValid(data, type)
        break
      case types.orgList: {
        const temp = (await csvtojson({
          colParser: {
            active: item => item.toLowerCase() === 'true',
            core: item => item.toLowerCase() === 'true'
          }
        })
          .fromStream(readableStream))
        valid = isValid(temp, type)
        if (valid) {
          data = temp
            .filter(x => x.orgCode !== 'UFD')
            .concat({ orgName: 'Undefined', orgCode: 'UFD', active: true, core: false })
        }
        break
      }
      case types.orgMap: {
        const res = await Promise.all([db.getOrganisationList(), csvtojson().fromStream(readableStream)])
        const orgList = res[0]
        data = res[1]
        if (validateOrgs(data, orgList)) {
          valid = isValid(data, type)
        } else {
          data = []
          valid = false
        }
        break
      }
      default:
        throw new Error(`Unknown reference data type: ${type}.`)
    }
  } catch (err) {
    valid = false
  }
  return {
    data,
    valid
  }
}
