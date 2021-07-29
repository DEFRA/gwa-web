const getContainerBlobs = require('../data/get-container-blobs')
const { formatDate } = require('../misc/helpers')
const { dataExtractContainer, dataExtractStorageConnectionString, dataSourcesContainer, dataSourcesStorageConnectionString, phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../config')

const fileMap = {
  'aad-users.json': 'Azure Active Directory',
  'aw-users.json': 'AirWatch'
}

module.exports = async () => {
  const [dataExtractBlobs, dataSourceBlobs, phoneNumberBlobs] = await Promise.all([
    getContainerBlobs(dataExtractStorageConnectionString, dataExtractContainer),
    getContainerBlobs(dataSourcesStorageConnectionString, dataSourcesContainer),
    getContainerBlobs(phoneNumbersStorageConnectionString, phoneNumbersContainer)
  ])

  const head = [{ text: 'Data item' }, { text: 'File' }, { text: 'Last modified' }]
  const rows = []
  rows.push(dataExtractBlobs.map(b => {
    return [
      { text: `${fileMap[b.name]} extract` },
      { text: b.name },
      { text: formatDate(b.properties.lastModified) }
    ]
  }))
  rows.push(dataSourceBlobs
    .filter(b => b.name !== 'internal-users.json')
    .map(b => {
      return [
        { text: `Upload for ${b.name.replace('.json', '')} (ALB)` },
        { text: b.name },
        { text: formatDate(b.properties.lastModified) }
      ]
    }))
  rows.push(phoneNumberBlobs.map(b => {
    return [
      { text: 'Phone number list' },
      { text: b.name },
      { text: formatDate(b.properties.lastModified) }
    ]
  }))

  return {
    head,
    rows: rows.flat()
  }
}
