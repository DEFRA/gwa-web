const { notifyDashboardUri } = require('../config')
const { scopes } = require('../permissions')
const getDataItemsTable = require('../lib/view/get-data-items-table')
const getUserStatsTable = require('../lib/view/get-user-stats-table')

module.exports = [
  {
    method: 'GET',
    path: '/system-status',
    handler: async (request, h) => {
      const [dataItemsTable, userStatsTable] = await Promise.all([
        getDataItemsTable(),
        getUserStatsTable()
      ])
      return h.view('system-status', { notifyDashboardUri, dataItemsTable, userStatsTable })
    },
    options: {
      auth: { access: { scope: [`+${scopes.data.manage}`] } }
    }
  }
]
