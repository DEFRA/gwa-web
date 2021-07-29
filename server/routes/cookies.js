const routeId = 'cookies'
const path = `/${routeId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: (request, h) => {
      return h.view(routeId)
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  }
]
