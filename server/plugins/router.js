const routes = [].concat(
  require('../routes/account'),
  require('../routes/auth'),
  require('../routes/contact-add'),
  require('../routes/contact-edit'),
  require('../routes/contact-remove'),
  require('../routes/home'),
  require('../routes/info'),
  require('../routes/message-create'),
  require('../routes/message-delete'),
  require('../routes/message-edit'),
  require('../routes/message-send'),
  require('../routes/message-view'),
  require('../routes/messages'),
  // require('../routes/upload'),
  require('../routes/public'),
  require('../routes/status')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
