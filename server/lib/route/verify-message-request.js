const boom = require('@hapi/boom')
const { messageStates } = require('../../constants')
const { getMessage } = require('../db')

module.exports = async (request, errorMessage) => {
  const { messageId } = request.params
  const message = await getMessage(messageId)

  if (!message) {
    return { error: boom.notFound() }
  }

  if (message.state === messageStates.sent) {
    return { error: boom.badRequest(errorMessage) }
  }
  return { message }
}
