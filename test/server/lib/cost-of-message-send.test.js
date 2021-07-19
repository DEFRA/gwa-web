const { textMessages: { oneMessageCost, oneMessageLength, twoMessageLength, additionalMessageIncrement, maxMessageLength } } = require('../../../server/constants')
const costOfMessageSend = require('../../../server/lib/messages/cost-of-message-send')

describe('Calculate the cost of sending the message', () => {
  test.each([
    [oneMessageLength, oneMessageCost],
    [oneMessageLength + 1, oneMessageCost * 2],
    [twoMessageLength, oneMessageCost * 2],
    [twoMessageLength + 1, oneMessageCost * 3],
    [twoMessageLength + additionalMessageIncrement, oneMessageCost * 3],
    [twoMessageLength + additionalMessageIncrement + 1, oneMessageCost * 4],
    [twoMessageLength + additionalMessageIncrement * 2, oneMessageCost * 4],
    [twoMessageLength + additionalMessageIncrement * 2 + 1, oneMessageCost * 5],
    [twoMessageLength + additionalMessageIncrement * 3, oneMessageCost * 5],
    [twoMessageLength + additionalMessageIncrement * 3 + 1, oneMessageCost * 6],
    [maxMessageLength, oneMessageCost * 6]
  ])('cost is calculated correctly based on the length of the text in the message - length %i', (textLength, expectedCost) => {
    const message = {
      contactCount: 1,
      text: 'a'.repeat(textLength)
    }

    const cost = costOfMessageSend(message)

    expect(cost).toEqual(expectedCost)
  })

  test.each([
    [1, oneMessageLength, oneMessageCost],
    [1, twoMessageLength, oneMessageCost * 2],
    [3, oneMessageLength, oneMessageCost * 3],
    [3, twoMessageLength, oneMessageCost * 3 * 2],
    [11, oneMessageLength, oneMessageCost * 11],
    [11, twoMessageLength, oneMessageCost * 11 * 2]
  ])('cost is calculated correctly based on the number of contacts and length of the message - %i contact(s), %i message length', (contactCount, textLength, expectedCost) => {
    const message = {
      contactCount,
      text: 'a'.repeat(textLength)
    }

    const cost = costOfMessageSend(message)

    expect(cost).toEqual(expectedCost)
  })
})
