const csvtojson = require('csvtojson')
const { officeLocationMappings, orgDataFileHeaders } = require('../../constants')
const { parsePhoneNumber } = require('../contact/phone-number')

/**
 * Convert a readableStream of a CSV file containing users into JSON.
 * CSV header is required. Columns are `emailAddress`, `givenName`, `surname`,
 * `officeLocation`, `phoneNumber` (in order).
 * Columns are mapped to properties with the same name expect `phoneNumber`
 * that becomes an array called `phoneNumbers`. In addition, the following
 * properties are also added:
 * - `officeCode` (based on mapping from `officeLocation`)
 * - `orgCode` based on the organisation associated to during the upload
 * - `orgName` based on the organisation associated to during the upload
 *
 * @param {Stream} readableStream CSV file of users.
 * @param {object} organisation organisation the users are associated to.
 * @param {Array} officeLocations list of office locations. Locations include
 * `orgCode` and `orgName`.
 * @returns {Array} containing users
 */
module.exports = async (readableStream, organisation, officeLocationMapRefData) => {
  const officeLocationMap = new Map(officeLocationMapRefData.map(ol => [ol.originalOfficeLocation, { officeCode: ol.officeCode, officeLocation: ol.officeLocation }]))

  return csvtojson({ headers: orgDataFileHeaders })
    .fromStream(readableStream)
    .subscribe(user => {
      user.emailAddress = user.emailAddress.toLowerCase()
      user.orgCode = organisation.orgCode
      user.orgName = organisation.orgName

      const office = officeLocationMap.get(user.officeLocation)
      user.officeLocation = office?.officeLocation ?? officeLocationMappings.unmappedOfficeLocation
      user.officeCode = office?.officeCode ?? officeLocationMappings.unmappedOfficeCode

      const pn = parsePhoneNumber(user.phoneNumber)
      user.phoneNumbers = [pn.e164]
      delete user.phoneNumber
    })
}
