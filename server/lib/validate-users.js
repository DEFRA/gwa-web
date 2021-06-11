const schema = require('./user-schema')

/**
 * Validate a list of users against a [Joi](https://joi.dev/) schema.
 *
 * @param {Array} users
 * @return {object} consisting of two arrays, `valid` and `nonValid`. `valid`
 * contains the original value of the user. `nonValid` contains a
 * [Joi validate result object](https://joi.dev/api/?v=17.4.0#anyvalidatevalue-options).
 */
module.exports = (users) => {
  const nonValid = []
  const valid = users.filter(user => {
    const result = schema.validate(user)
    if (result.error) {
      nonValid.push(result)
      return false
    }
    return true
  })

  return {
    nonValid,
    valid
  }
}
