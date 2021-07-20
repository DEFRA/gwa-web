const { getMessages } = require('../db')
const { messageStates: { sent } } = require('../../constants')

module.exports = async () => {
  return getMessages(`SELECT * FROM c WHERE c.state = "${sent}" ORDER BY c.lastUpdatedAt DESC`)
}
