const { notifyDashboardUri } = require('../config')
const { scopes } = require('../permissions')
const getStatusTable = require('../lib/view/get-status-table')

module.exports = [
  {
    method: 'GET',
    path: '/system-status',
    handler: async (request, h) => {
      const table = await getStatusTable()
      return h.view('system-status', { notifyDashboardUri, table })
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } }
    }
  }
]
