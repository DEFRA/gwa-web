const downloadBlob = require('./download-blob')
const { dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../config')

/**
 * Downloads a JSON file from the `data-sources` blob storage container. The
 * file attempted to be downloaded is `{orgCode}.json`. If the file doesn't
 * exist `undefined` is returned.
 *
 * @param {string} orgCode organsation code of the file to download.
 * @returns {string} representing the content of the file or `undefined` if
 * there is no file.
 */
module.exports = async orgCode => {
  return downloadBlob(dataSourcesStorageConnectionString, dataSourcesContainer, `${orgCode}.json`)
}
