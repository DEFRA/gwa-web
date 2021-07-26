const { parseAsync, transforms: { unwind } } = require('json2csv')

/**
 * Convert a list of users in a string of JSON to a string of CSV formatted
 * data. Each user must have an array of `phoneNumbers`. For every item in the
 * array a row will be created. It is therefore expected each user will only
 * have a single item array of `phoneNumbers`.
 *
 * @param {string} data string of JSON Array data made up of `users` including
 * an array of `phoneNumbers`.
 * @return {string} representing users in CSV format.
 */
module.exports = async data => {
  console.log(data)
  console.log(JSON.parse(data))
  // TODO: get rid of columns - orgCode, orgName, officeCode and change name of `phoneNumbers` to `phoneNumber`
  return parseAsync(JSON.parse(data), { transforms: unwind({ paths: 'phoneNumbers' }) })
}
