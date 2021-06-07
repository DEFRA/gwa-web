const { textMessages: { oneMessageCost, oneMessageLength, twoMessageLength, additionalMessageIncrement } } = require('../constants')

/**
 * Calculate the cost of sending the message.
 *
 * @param {ojbect} message containing list of `contactCount` and `text`.
 * @returns the cost for sending the message, in GBP (£).
 */
module.exports = (message) => {
  const textLength = message.text.length
  let messageCount
  if (textLength <= oneMessageLength) {
    messageCount = 1
  } else if (textLength <= twoMessageLength) {
    messageCount = 2
  } else if (textLength <= twoMessageLength + additionalMessageIncrement) {
    messageCount = 3
  } else if (textLength <= twoMessageLength + additionalMessageIncrement * 2) {
    messageCount = 4
  } else if (textLength <= twoMessageLength + additionalMessageIncrement * 3) {
    messageCount = 5
  } else {
    messageCount = 6
  }
  return message.contactCount * messageCount * oneMessageCost
}
