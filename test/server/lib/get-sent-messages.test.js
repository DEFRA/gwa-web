describe('get sent messages', () => {
  const getSentMessages = require('../../../server/lib/get-sent-messages')
  const { messageStates: { sent } } = require('../../../server/constants')

  jest.mock('../../../server/lib/db')
  const { getMessages } = require('../../../server/lib/db')

  test('returns messages and uses correct query when getting messages', async () => {
    const mockMessages = [{ a: 1 }]
    getMessages.mockResolvedValue(mockMessages)

    const sentMessages = await getSentMessages()

    expect(sentMessages).toEqual(mockMessages)
    expect(getMessages).toBeCalled()
    expect(getMessages).toBeCalledWith(`SELECT * FROM c WHERE c.state = "${sent}" ORDER BY c.lastUpdatedAt DESC`)
  })
})
