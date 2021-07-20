const phonelib = require('google-libphonenumber')

const formats = phonelib.PhoneNumberFormat
const phoneUtil = phonelib.PhoneNumberUtil.getInstance()
const types = phonelib.PhoneNumberType

/**
 * Parse a telephone number
 *
 * @param {string} phoneNumber.
 * @param {string} [region="GB"] region to parse the phone number as.
 * @returns {object} object representing the parsed phone number.
 */
function parsePhoneNumber (phoneNumber, region = 'GB') {
  try {
    const parsed = phoneUtil.parse(phoneNumber, region)
    const national = phoneUtil.format(parsed, formats.NATIONAL)
    const international = phoneUtil.format(parsed, formats.INTERNATIONAL)
    const e164 = phoneUtil.format(parsed, formats.E164)
    const type = phoneUtil.getNumberType(parsed)

    return {
      original: phoneNumber,
      national,
      international,
      e164,
      type
    }
  } catch (e) {
    return {
      original: phoneNumber,
      national: undefined,
      international: undefined,
      e164: undefined,
      type: types.UNKNOWN
    }
  }
}

module.exports = {
  parsePhoneNumber,
  types
}
