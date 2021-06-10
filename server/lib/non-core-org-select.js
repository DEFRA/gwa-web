/**
 * Generates the items for use in a [GOV.UK
 * select](https://design-system.service.gov.uk/components/select/) component.
 * Specifically, the non-core organisations.
 *
 * @param {Array} organisations list of organisations with `core` (flag indicating
 * exclusion), `active` (flag indicating if the org should be listed) `orgCode`
 * and `orgName`.
 * @param {string} [selected=''] the item to set as selected, defaults to
 * 'Select an organisation' option..
 * @returns {Array} `items` for GOV.UK select.
 */
module.exports = (organisations, selected = '') => {
  const nonCoreOrganisations = organisations
    .filter(org => !org.core && org.active)
    .map(org => { return { text: org.orgName, value: org.orgCode, selected: org.orgCode === selected } })
  nonCoreOrganisations.unshift({ text: 'Select an organisation', selected: selected === '' })
  return nonCoreOrganisations
}
