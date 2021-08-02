const { notifyDashboardUri } = require('../config')
const { scopes } = require('../permissions')
const getDataItemsTable = require('../lib/view/get-data-items-table')

module.exports = [
  {
    method: 'GET',
    path: '/system-status',
    handler: async (request, h) => {
      const table = await getDataItemsTable()
      return h.view('system-status', { notifyDashboardUri, table })
    },
    options: {
      auth: { access: { scope: [`+${scopes.data.manage}`] } }
    }
  }
]
