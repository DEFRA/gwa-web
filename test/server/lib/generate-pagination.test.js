const { messages: { sentMessagePageSize } } = require('../../../server/constants')

describe('generating pagination', () => {
  const generatePagination = require('../../../server/lib/generate-pagination')

  test('returns pagination object', () => {
    const pagination = generatePagination(1, sentMessagePageSize)

    expect(pagination).toHaveProperty('shouldDisplay')
    expect(pagination).toHaveProperty('links')
    expect(pagination.links).toHaveProperty('previous')
    expect(pagination.links).toHaveProperty('next')
    expect(pagination).toHaveProperty('numberOfPages')
    expect(pagination).toHaveProperty('numberOfResults')
    expect(pagination).toHaveProperty('pageSize')
    expect(pagination).toHaveProperty('resultsFrom')
    expect(pagination).toHaveProperty('resultsTo')
  })

  test('returns correct pagination when no pagination required', () => {
    const numberOfResults = sentMessagePageSize

    const pagination = generatePagination(1, numberOfResults)

    expect(pagination.shouldDisplay).toEqual(false)
    expect(pagination.links.previous).toEqual('')
    expect(pagination.links.next).toEqual('')
    expect(pagination.numberOfPages).toEqual(1)
    expect(pagination.numberOfResults).toEqual(numberOfResults)
    expect(pagination.pageSize).toEqual(sentMessagePageSize)
    expect(pagination.resultsFrom).toEqual(1)
    expect(pagination.resultsTo).toEqual(numberOfResults)
  })

  test('returns correct pagination for first page', () => {
    const numberOfResults = sentMessagePageSize + 1

    const pagination = generatePagination(1, numberOfResults)

    expect(pagination.shouldDisplay).toEqual(true)
    expect(pagination.links.previous).toEqual('')
    expect(pagination.links.next).toEqual('/messages-sent/2')
    expect(pagination.numberOfPages).toEqual(2)
    expect(pagination.numberOfResults).toEqual(numberOfResults)
    expect(pagination.pageSize).toEqual(sentMessagePageSize)
    expect(pagination.resultsFrom).toEqual(1)
    expect(pagination.resultsTo).toEqual(sentMessagePageSize)
  })

  test('returns correct pagination for last page', () => {
    const numberOfResults = sentMessagePageSize + 1

    const pagination = generatePagination(2, numberOfResults)

    expect(pagination.shouldDisplay).toEqual(true)
    expect(pagination.links.previous).toEqual('/messages-sent/1')
    expect(pagination.links.next).toEqual('')
    expect(pagination.numberOfPages).toEqual(2)
    expect(pagination.numberOfResults).toEqual(numberOfResults)
    expect(pagination.pageSize).toEqual(sentMessagePageSize)
    expect(pagination.resultsFrom).toEqual(sentMessagePageSize + 1)
    expect(pagination.resultsTo).toEqual(numberOfResults)
  })

  test('returns correct pagination for middle page', () => {
    const numberOfResults = sentMessagePageSize * 2 + 1

    const pagination = generatePagination(2, numberOfResults)

    expect(pagination.shouldDisplay).toEqual(true)
    expect(pagination.links.previous).toEqual('/messages-sent/1')
    expect(pagination.links.next).toEqual('/messages-sent/3')
    expect(pagination.numberOfPages).toEqual(3)
    expect(pagination.numberOfResults).toEqual(numberOfResults)
    expect(pagination.pageSize).toEqual(sentMessagePageSize)
    expect(pagination.resultsFrom).toEqual(sentMessagePageSize + 1)
    expect(pagination.resultsTo).toEqual(sentMessagePageSize * 2)
  })
})
