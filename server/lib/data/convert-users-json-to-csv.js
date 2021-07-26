const { parseAsync } = require('json2csv')

function takeFirstPhoneNumber (item) {
  item.phoneNumbers = item.phoneNumbers[0] ?? ''
  return item
}

/**
 * Convert a list of users from a JSON string to a CSV string format.
 * Each user must have `emailAddress`, `givenName`, `surname`, `officeLocation`
 * and `phoneNumbers` properties. `phoneNumbers` must be an array. Only the
 * first phone number in the aray will be used.
 *
 * @param {string} data JSON string of users.
 * @return {string} representing CSV formatted users.
 */
module.exports = async data => {
  return parseAsync(JSON.parse(data), {
    fields: ['emailAddress', 'givenName', 'surname', 'officeLocation', { value: 'phoneNumbers', label: 'phoneNumber' }],
    transforms: [takeFirstPhoneNumber]
  })
}
