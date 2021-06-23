const { parseAsync } = require('json2csv')

/**
 * Converts a list of office location mappings into CSV data, using object
 * properties for column names in header.
 *
 * @param {Array} organisationList.
 * @returns {String} CSV representation of officeLocationMap.
 */
async function getOfficeLocationMapCSV (officeLocationMap) {
  return parseAsync(officeLocationMap)
}

/**
 * Converts a list of organisations into CSV data, using object properties for
 * column names in header.
 *
 * @param {Array} organisationList.
 * @returns {String} CSV representation of organisationList.
 */
async function getOrganisationListCSV (organisationList) {
  return parseAsync(organisationList)
}

/**
 * Converts a list of mappings between the `originalOrgName` of an organisation
 * and the acutal organisation via the `orgCode` into CSV data.
 *
 * @param {Array} organisationMap.
 * @returns {String} CSV representation of organisationMap consisting of
 * `originalOrgName`, `orgName` and `orgCode`.
 */
async function getOrganisationMapCSV (organisationMap) {
  return parseAsync(organisationMap)
}

module.exports = {
  getOfficeLocationMapCSV,
  getOrganisationListCSV,
  getOrganisationMapCSV
}
