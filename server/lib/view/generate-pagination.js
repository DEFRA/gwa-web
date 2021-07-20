const { messages: { sentMessagePageSize } } = require('../../constants')

module.exports = (page, numberOfResults) => {
  const pageSize = sentMessagePageSize
  const resultsFrom = 1 + (page - 1) * pageSize
  const maxOnPage = page * pageSize
  const resultsTo = numberOfResults <= maxOnPage ? numberOfResults : maxOnPage

  const previous = page > 1 ? `/messages-sent/${page - 1}` : ''
  const next = numberOfResults > maxOnPage ? `/messages-sent/${page + 1}` : ''

  return {
    shouldDisplay: !!(previous || next),
    links: {
      previous,
      next
    },
    numberOfPages: Math.ceil(numberOfResults / pageSize),
    numberOfResults,
    pageSize,
    resultsFrom,
    resultsTo
  }
}
