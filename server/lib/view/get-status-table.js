const getContainerBlobs = require('../data/get-container-blobs')
const { formatDate } = require('../misc/helpers')
const { dataExtractContainer, dataExtractStorageConnectionString, dataSourcesContainer, dataSourcesStorageConnectionString } = require('../../config')

const fileMap = {
  'aad-users.json': 'Azure Active Directory extract',
  'aw-users.json': 'AirWatch extract'
}

module.exports = async () => {
  const [dataExtractBlobs, dataSourceBlobs] = await Promise.all([
    getContainerBlobs(dataExtractStorageConnectionString, dataExtractContainer),
    getContainerBlobs(dataSourcesStorageConnectionString, dataSourcesContainer)
  ])

  const head = [{ text: 'Data item' }, { text: 'Last modified' }]
  const rows = []
  rows.push(dataExtractBlobs.map(b => {
    return [
      { text: fileMap[b.name] },
      { text: formatDate(b.properties.lastModified) }
    ]
  }))
  rows.push(dataSourceBlobs
    .filter(b => b.name !== 'internal-users.json')
    .map(b => {
      return [
        { text: `Upload for ${b.name.replace('.json', '')} (ALB)` },
        { text: formatDate(b.properties.lastModified) }
      ]
    }))

  return {
    head,
    rows: rows.flat()
  }
}
