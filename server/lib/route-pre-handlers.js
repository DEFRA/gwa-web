const boom = require('@hapi/boom')

const { getUser } = require('./db')

module.exports = {
  getUser: {
    method: async (request, h) => {
      const userId = request.auth.credentials.user.id
      const user = await getUser(userId)

      if (!user || !user.active) {
        return boom.notFound(`No active user found for ${userId}.`)
      }
      return user
    },
    assign: 'user',
    failAction: 'error'
  }
}
