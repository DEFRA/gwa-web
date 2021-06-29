/**
 * Generate the `officeCode` for the office based on `areaCode` and
 * `officeLocation`.
 *
 * @param {object} office containing `areaCode` and `officeLocation`.
 * @returns {string} representing the office code.
 */
module.exports = office => {
  return `${office.areaCode.toUpperCase()}:${office.officeLocation.trim().replace(/[^a-z0-9+]/gi, '-').replace(/-+/g, '-').replace(/^-*/, '').replace(/-*$/, '')}`
}
