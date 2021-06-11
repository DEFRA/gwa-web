const csv = require('csvtojson')
const { v5: uuidv5 } = require('uuid')
const { officeLocationMappings } = require('../constants')

/**
 * Convert a readableStream of a CSV file containing users to JSON.
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
 * @returns {Array} of users
 */
module.exports = async (readableStream, organisation, officeLocationMapRefData) => {
  const officeLocationMap = new Map(officeLocationMapRefData.map(ol => [ol.originalOfficeLocation, { officeCode: ol.officeCode, officeLocation: ol.officeLocation }]))

  const users = await csv({ headers: ['emailAddress', 'givenName', 'surname', 'officeLocation', 'phoneNumber'] }).fromStream(readableStream)
  users.forEach(user => {
    user.id = uuidv5(user.emailAddress, uuidv5.URL)
    const office = officeLocationMap.get(user.officeLocation)
    user.officeLocation = office?.officeLocation ?? officeLocationMappings.unmappedOfficeLocation
    user.officeCode = office?.officeCode ?? officeLocationMappings.unmappedOfficeCode
    user.orgCode = organisation.orgCode
    user.orgName = organisation.orgName
  })

  return {
    errors: [],
    users
  }
}
