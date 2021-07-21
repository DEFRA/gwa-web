describe('Getting receipt data', () => {
  const getReceiptData = require('../../../../server/lib/data/get-receipt-data')
  const { internalStatuses, notifyStatuses } = require('../../../../server/lib/data/receipt-statuses')

  jest.mock('../../../../server/lib/db')
  const { getReceipts } = require('../../../../server/lib/db')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('queries and response are correct for getting the receipt data', async () => {
    const messageId = '12345678'
    const failedToSend = 1
    const notifyDelivered = 2
    const notifyFailed = 3
    const pendingSending = 4
    const rateLimited = 5
    const timeOfFirstSend = Date.now()
    const timeOfLastSend = Date.now()
    const toBeRetried = 8
    getReceipts
      .mockResolvedValueOnce([{ count: failedToSend }])
      .mockResolvedValueOnce([{ count: notifyDelivered }])
      .mockResolvedValueOnce([{ count: notifyFailed }])
      .mockResolvedValueOnce([{ count: pendingSending }])
      .mockResolvedValueOnce([{ count: rateLimited }])
      .mockResolvedValueOnce([{ sent_at: timeOfFirstSend }])
      .mockResolvedValueOnce([{ sent_at: timeOfLastSend }])
      .mockResolvedValueOnce([{ count: toBeRetried }])

    const stats = await getReceiptData(messageId)

    expect(stats).toHaveProperty('failedToSend')
    expect(stats.failedToSend).toEqual(failedToSend)
    expect(stats).toHaveProperty('notifyDelivered')
    expect(stats.notifyDelivered).toEqual(notifyDelivered)
    expect(stats).toHaveProperty('notifyFailed')
    expect(stats.notifyFailed).toEqual(notifyFailed)
    expect(stats).toHaveProperty('pendingSending')
    expect(stats.pendingSending).toEqual(pendingSending)
    expect(stats).toHaveProperty('rateLimited')
    expect(stats.rateLimited).toEqual(rateLimited)
    expect(stats).toHaveProperty('timeOfFirstSend')
    expect(stats.timeOfFirstSend).toEqual(timeOfFirstSend)
    expect(stats).toHaveProperty('timeOfLastSend')
    expect(stats.timeOfLastSend).toEqual(timeOfLastSend)
    expect(stats).toHaveProperty('toBeRetried')
    expect(stats.toBeRetried).toEqual(toBeRetried)

    expect(getReceipts).toHaveBeenCalledTimes(8)
    expect(getReceipts).toHaveBeenNthCalledWith(1, `SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.failedToSend}"`)
    expect(getReceipts).toHaveBeenNthCalledWith(2, `SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${notifyStatuses.delivered}"`)
    expect(getReceipts).toHaveBeenNthCalledWith(3, `SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status IN ("${notifyStatuses.permanentFailure}", "${notifyStatuses.temporaryFailure}", "${notifyStatuses.technicalFailure}")`)
    expect(getReceipts).toHaveBeenNthCalledWith(4, `SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.sent}"`)
    expect(getReceipts).toHaveBeenNthCalledWith(5, `SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.rateLimited}"`)
    expect(getReceipts).toHaveBeenNthCalledWith(6, `SELECT TOP 1 c.sent_at FROM c WHERE c.messageId = "${messageId}" AND c.status = "${notifyStatuses.delivered}" ORDER BY c.sent_at ASC`)
    expect(getReceipts).toHaveBeenNthCalledWith(7, `SELECT TOP 1 c.sent_at FROM c WHERE c.messageId = "${messageId}" AND c.status = "${notifyStatuses.delivered}" ORDER BY c.sent_at DESC`)
    expect(getReceipts).toHaveBeenNthCalledWith(8, `SELECT COUNT(c.id) AS count FROM c WHERE c.messageId = "${messageId}" AND c.status = "${internalStatuses.retry}"`)
  })

  test.each([
    { value: [{ unexpected: 'property' }] },
    { value: [] }
  ])('undefined is returned when expected property is not included in response', async ({ value }) => {
    getReceipts.mockResolvedValue(value)

    const stats = await getReceiptData(1)

    expect(stats.failedToSend).toBeUndefined()
    expect(stats.notifyDelivered).toBeUndefined()
    expect(stats.notifyFailed).toBeUndefined()
    expect(stats.pendingSending).toBeUndefined()
    expect(stats.rateLimited).toBeUndefined()
    expect(stats.timeOfFirstSend).toBeUndefined()
    expect(stats.timeOfLastSend).toBeUndefined()
    expect(stats.toBeRetried).toBeUndefined()
  })
})
