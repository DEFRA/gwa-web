/**
 * Gets the 'all' or area office code based on the `officeCode` of the user.
 * This is typically used to default the `subscribedTo` property for a phone
 * number.
 * It just replaces the specific office's string with a '*' so if a user's
 * `officeCode` was `ABC:office-location` this function would return `ABC:*`.
 *
 * @param {object} user Must contain an `officeCode` property.
 * @returns {string} the 'all' office code.
 */
function getAreaOfficeCode (user) {
  return user.officeCode.split(':')[0] + ':*'
}

/**
 * Gets the coloured class for the
 * [GOV.UK tag](https://design-system.service.gov.uk/components/tag/)
 * component based on the `status`.
 *
 * @param {string} status of a component from Notify's StatusPage API JSON.
 * @return {string} govuk-tag--<colour> based on `status`.
 */
function getComponentTag (status) {
  switch (status) {
    case 'operational':
      return 'govuk-tag--green'
    case 'degraded_performance':
      return 'govuk-tag--yellow'
    case 'partial_outage':
      return 'govuk-tag--orange'
    case 'major_outage':
      return 'govuk-tag--red'
    default:
      return 'govuk-tag--grey'
  }
}

/**
 * Gets the coloured class for the
 * [GOV.UK tag](https://design-system.service.gov.uk/components/tag/)
 * component based on the `status`.
 *
 * @param {string} indicator from Notify's StatusPage API JSON.
 * @return {string} govuk-tag--<colour> based on `status`.
 */
function getServiceTag (indicator) {
  switch (indicator) {
    case 'none':
      return 'govuk-tag--green'
    case 'minor':
      return 'govuk-tag--yellow'
    case 'major':
      return 'govuk-tag--orange'
    case 'critical':
      return 'govuk-tag--red'
    default:
      return 'govuk-tag--grey'
  }
}

module.exports = {
  getAreaOfficeCode,
  getComponentTag,
  getServiceTag
}
