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

module.exports = {
  getAreaOfficeCode
}
