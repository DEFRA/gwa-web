function getErrorMessageForObject (messages, error) {
  return typeof messages === 'object' ? messages : error.message
}

function getErrorMessage (messages, error) {
  return messages[error.type] ||
    messages['*'] ||
    getErrorMessageForObject(messages, error)
}

function mapErrors (errors, errorMessages) {
  const map = {}

  errors.details.forEach(error => {
    const contextKey = error.path[0]
    const messages = errorMessages[contextKey] || {}
    map[contextKey] = typeof messages === 'string'
      ? messages
      : getErrorMessage(messages, error)
  })

  return map
}

function getMappedErrors (err, errorMessages) {
  if (err && Array.isArray(err.details)) {
    return mapErrors(err, errorMessages)
  }
}

function getErrorText (error) {
  return typeof error === 'object' ? error.text : error
}

function getErrorSummaryText (error) {
  return typeof error === 'object' ? error.summary : error
}

function getErrors (mappedErrors) {
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
