const { scopes } = require('../permissions')
const getContainerBlobs = require('../lib/data/get-container-blobs')
const { dataExtractContainer, dataExtractStorageConnectionString, dataSourcesContainer, dataSourcesStorageConnectionString } = require('../config')

module.exports = [
  {
    method: 'GET',
    path: '/system-status',
    handler: async (request, h) => {
      // TODO: get some status information
      // * Last extract of AW (from data-extract)
      // * Last extract of AAD (from data-extract)
      // * Last generation of phone numbers (from phone-numbers)
      const dataExtractBlobs = await getContainerBlobs(dataExtractStorageConnectionString, dataExtractContainer)
      const dataSourceBlobs = await getContainerBlobs(dataSourcesStorageConnectionString, dataSourcesContainer)

      const rows = [
        [{ text: 'item' }, { text: '10' }]
      ]
      return h.view('system-status', { rows })
    },
    options: {
      auth: { access: { scope: [`+${scopes.message.manage}`] } }
    }
  }
]
