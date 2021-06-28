const { updateReferenceData } = require('./db')
const { typeInfo } = require('./reference-data')

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
    id: typeInfo[type].id,
    data
  }
  return updateReferenceData(referenceDataItem)
}
