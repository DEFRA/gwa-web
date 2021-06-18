const routes = [].concat(
  require('../routes/account'),
  require('../routes/auth'),
  require('../routes/contact-add'),
  require('../routes/contact-edit'),
  require('../routes/contact-remove'),
  require('../routes/data-manage'),
  require('../routes/home'),
  require('../routes/message-create'),
  require('../routes/message-delete'),
  require('../routes/message-edit'),
  require('../routes/message-send'),
  require('../routes/message-view'),
  require('../routes/messages'),
  require('../routes/public'),
  // TODO: Look into what the status route provides
  require('../routes/status'),
  require('../routes/upload')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
