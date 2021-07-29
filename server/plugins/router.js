const routes = [].concat(
  require('../routes/account'),
  require('../routes/auth'),
  require('../routes/contact-add'),
  require('../routes/contact-edit'),
  require('../routes/contact-remove'),
  require('../routes/data-manage'),
  require('../routes/data-reference'),
  require('../routes/data-reference-manage'),
  require('../routes/data-reference-download'),
  require('../routes/home'),
  require('../routes/message-create'),
  require('../routes/message-delete'),
  require('../routes/message-edit'),
  require('../routes/message-send'),
  require('../routes/message-view'),
  require('../routes/messages'),
  require('../routes/messages-sent'),
  require('../routes/org-data'),
  require('../routes/org-data-download'),
  require('../routes/org-data-upload'),
  require('../routes/phone-numbers'),
  require('../routes/phone-numbers-download'),
  require('../routes/public'),
  require('../routes/system-status'),
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
