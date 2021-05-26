const routes = [].concat(
  require('../routes/auth'),
  require('../routes/home'),
  require('../routes/account'),
  require('../routes/contact-add'),
  require('../routes/contact-edit'),
  require('../routes/contact-remove'),
  require('../routes/info'),
  require('../routes/message-create'),
  require('../routes/messages'),
  // require('../routes/message'),
  // require('../routes/edit-message'),
  // require('../routes/confirm-delete'),
  // require('../routes/confirm-deactivate'),
  // require('../routes/confirm-approve'),
  // require('../routes/confirm-send'),
  // require('../routes/upload'),
  require('../routes/status'),
  require('../routes/public')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
