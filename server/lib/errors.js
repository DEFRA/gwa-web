function mapErrors (errors, errorMessages) {
  const map = {}

  errors.details.forEach(error => {
    const contextKey = error.path[0]
    const messages = errorMessages[contextKey] || {}
    map[contextKey] = typeof messages === 'string'
      ? messages
      : messages[error.type] || messages['*'] ||
      (typeof messages === 'object' ? messages : error.message)
  })

  return map
}

// Error helper functions
// (Allows error summary text to differ from field error text)
function getErrorText (error) {
  return typeof error === 'object' ? error.text : error
}

function getErrorSummaryText (error) {
  return typeof error === 'object' ? error.summary : error
}

function getMappedErrors (err, errorMessages) {
  if (err && Array.isArray(err.details)) {
    return mapErrors(err, errorMessages)
  }
}

const getErrors = (mappedErrors) => {
  const errors = {}
  const errorList = []

  if (mappedErrors) {
    Object.keys(mappedErrors).forEach(key => {
      errors[key] = { text: getErrorText(mappedErrors[key]) }
      errorList.push({
        text: getErrorSummaryText(mappedErrors[key]),
        href: `#${key}`
      })
    })
  }

  return {
    errors,
    errorList
  }
}

module.exports = {
  getErrors,
  getMappedErrors
}
