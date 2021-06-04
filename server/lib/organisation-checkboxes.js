const { getOrganisationList } = require('./db')

/**
 * Generates [GOV.UK
 * checkboxes](https://design-system.service.gov.uk/components/checkboxes/)
 * based on a list of organisations. An optional list of organisations to
 * mark as checked can be supplied.
 *
 * @param {Array} [checked=[]] list of organisation codes to be checked.
 * @returns {Array} `items` for GOV.UK checkboxes
 */
module.exports = async (checked = []) => {
  const organisationList = await getOrganisationList()
  return organisationList
    .filter(o => o.active)
    .map(o => { return { text: o.orgName, value: o.orgCode, checked: checked.includes(o.orgCode) } })
}
