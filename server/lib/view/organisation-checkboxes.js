/**
 * Generates items for use in a
 * [GOV.UK checkboxes](https://design-system.service.gov.uk/components/checkboxes/)
 * component, based on a list of organisations.
 * An optional list of organisations to mark as checked can be supplied.
 *
 * @param {Array} organisationList list of organisations.
 * @param {Array} [checked=[]] list of organisation codes to be checked.
 * @returns {Array} `items` for GOV.UK checkboxes.
 */
module.exports = (organisationList, checked = []) => {
  return organisationList
    .filter(o => o.active)
    .map(o => { return { text: o.orgName, value: o.orgCode, checked: checked.includes(o.orgCode) } })
}
