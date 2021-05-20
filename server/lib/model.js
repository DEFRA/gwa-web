const { getErrors } = require('./errors')

/**
 * Base View Model Class - represents a page view
 * @constructor
 * @param {object} data - The page data
 * @param {object} [err] - The page error data
 * @param {object} [errorMessages] - The errorMessages
 * @param {...object} [rest] - The remaining arguments
 */
class BaseModel {
  constructor (data, err, errorMessages, ...rest) {
    const errors = getErrors(err, errorMessages)
    Object.assign(this, { data }, errors, ...rest)
  }
}

module.exports = BaseModel
