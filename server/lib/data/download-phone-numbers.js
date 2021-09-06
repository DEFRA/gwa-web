const downloadBlob = require('./download-blob')
const { phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../config')
const { phoneNumbersFilename } = require('../../constants')

/**
 * Downloads the `phoneNumbersFilename` file from the `phoneNumbers` blob
 * storage container. If the file doesn't exist `undefined` is returned.
 *
 * @returns {string} representing the content of the file or `undefined` if
 * there is no file.
 */
module.exports = async () => {
  return downloadBlob(phoneNumbersStorageConnectionString, phoneNumbersContainer, phoneNumbersFilename)
}
