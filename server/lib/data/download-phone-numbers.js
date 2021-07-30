const downloadBlob = require('./download-blob')
const { phoneNumbersContainer, phoneNumbersFile, phoneNumbersStorageConnectionString } = require('../../config')

/**
 * Downloads the `phoneNumbersFile` file from the `phoneNumbers` blob
 * storage container. If the file doesn't exist `undefined` is returned.
 *
 * @returns {string} representing the content of the file or `undefined` if
 * there is no file.
 */
module.exports = async () => {
  return downloadBlob(phoneNumbersStorageConnectionString, phoneNumbersContainer, phoneNumbersFile)
}
