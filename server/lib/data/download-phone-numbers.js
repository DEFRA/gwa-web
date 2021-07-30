const downloadBlob = require('./download-blob')
const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../config')

/**
 * Downloads the `phone-numbers.csv` file from the `phone-numbers` blob
 * storage container. If the file doesn't exist `undefined` is returned.
 *
 * @returns {string} representing the content of the file or `undefined` if
 * there is no file.
 */
module.exports = async () => {
  return downloadBlob(phoneNumbersStorageConnectionString, phoneNumbersContainer, 'phone-numbers.csv')
}
