const csv = require('csvtojson')
const { v5: uuidv5 } = require('uuid')
const { officeLocationMappings } = require('../constants')
const { parsePhoneNumber, types } = require('./phone-number')

/**
 * Convert a readableStream of a CSV file containing users into two JSON arrays
 * representing users (`error` and `valid`).
 * CSV header is required. Columns are `emailAddress`, `givenName`, `surname`,
 * `officeLocation`, `phoneNumber` (in order).
 * Columns are mapped to properties with the same name. Additional properties
 * are added:
 * - `id` uuidv5 based on emailAddress
 * - `officeCode` (based on mapping from `officeLocation`)
 * - `orgCode` based on the organisation associated to in the upload
 * - `orgName` based on the organisation associated to in the upload
 *
 * @param {Stream} readableStream CSV file of users.
 * @param {object} organisation organisation the users are associated to.
 * @param {Array} officeLocations list of office locations.
 * includes `orgCode` and `orgName`.
 * @returns {object} containing two arrays of users - `error` and `valid`.
 */
module.exports = async (readableStream, organisation, officeLocationMapRefData) => {
  const officeLocationMap = new Map(officeLocationMapRefData.map(ol => [ol.originalOfficeLocation, { officeCode: ol.officeCode, officeLocation: ol.officeLocation }]))
  const error = []
  const valid = []

  const users = await csv({ headers: ['emailAddress', 'givenName', 'surname', 'officeLocation', 'phoneNumber'] }).fromStream(readableStream)
  users.forEach(user => {
    user.id = uuidv5(user.emailAddress, uuidv5.URL)
    user.orgCode = organisation.orgCode
    user.orgName = organisation.orgName

    const office = officeLocationMap.get(user.officeLocation)
    user.officeLocation = office?.officeLocation ?? officeLocationMappings.unmappedOfficeLocation
    user.officeCode = office?.officeCode ?? officeLocationMappings.unmappedOfficeCode

    const pn = parsePhoneNumber(user.phoneNumber)
    if (pn.type === types.MOBILE) {
      user.phoneNumber = pn.e164
      valid.push(user)
    } else {
      error.push(user)
    }
  })

  return {
    error,
    valid
  }
}
