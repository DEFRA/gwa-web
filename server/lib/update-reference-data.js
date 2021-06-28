const { updateReferenceData } = require('./db')
const { ids } = require('./reference-data')

/**
 * Uploads a JSON file to the 'data-sources' blob storage container. The
 * contents of the file is whatever is contained in `users`. The name of the
 * file is `{orgCode}.json`.
 *
 * @param {object} users list of users.
 * @param {string} orgCode organisation code to name the file with.
 * @returns {boolean} represents success of upload.
 */
module.exports = async (data, type) => {
  const referenceDataItem = {
    id: ids[type],
    data
  }
  console.log('UPLOADING...', referenceDataItem)
  return updateReferenceData(referenceDataItem)
}
