/**
 * Generates [GOV.UK
 * checkboxes](https://design-system.service.gov.uk/components/checkboxes/)
 * based on a list or organisations with an optional list of organisations to
 * mark as checked.
 *
 * @param {Array} organisationList - list of organisations
 * @param {Array} [checked=[]] - list of organisation codes to be checked
 */
module.exports = (organisationList, checked = []) => {
  return organisationList.map(o => { return { text: o.orgDescription, value: o.orgCode, checked: checked.includes(o.orgCode) } })
}
