const getContainerBlobs = require('../data/get-container-blobs')
const { formatDate } = require('../misc/helpers')
const { dataExtractContainer, dataExtractStorageConnectionString, dataSourcesContainer, dataSourcesStorageConnectionString, phoneNumbersContainer, phoneNumbersStorageConnectionString } = require('../../config')

const fileMap = {
  'aad-users.json': 'Azure Active Directory',
  'aw-users.json': 'AirWatch'
}

async function getDataExtractBlobsAsRows () {
  const blobs = await getContainerBlobs(dataExtractStorageConnectionString, dataExtractContainer)
  return blobs.map(b => {
    return [
      { text: `${fileMap[b.name]} extract` },
      { text: b.name },
      { text: formatDate(b.properties.lastModified) }
    ]
  })
}

async function getDataSourceBlobsAsRows () {
  const blobs = await getContainerBlobs(dataSourcesStorageConnectionString, dataSourcesContainer)
  return blobs
    .filter(b => !(b.name === 'internal-users.json' || b.name === 'trigger.json'))
    .map(b => {
      return [
        { text: `Upload for ${b.name.replace('.json', '')} (ALB)` },
        { text: b.name },
        { text: formatDate(b.properties.lastModified) }
      ]
    })
}

async function getPhoneNumberBlobAsRows () {
  const blobs = await getContainerBlobs(phoneNumbersStorageConnectionString, phoneNumbersContainer)
  return blobs.map(b => {
    return [
      { text: 'Phone number list' },
      { text: b.name },
      { text: formatDate(b.properties.lastModified) }
    ]
  })
}

/**
 * Gets all the data required and returns an object ready to be used in the
 * [GOV.UK table](https://design-system.service.gov.uk/components/table/)
 * component.
 * The table will include names of and last modified dates for:
 * * data extract blobs
 * * data source blobs
 * * phone number blob
 *
 * @return {object} including `head` and `rows` to be used in to GOV.UK table.
 */
module.exports = async () => {
  const rows = await Promise.all([
    getDataExtractBlobsAsRows(),
    getDataSourceBlobsAsRows(),
    getPhoneNumberBlobAsRows()
  ])

  return {
    head: [{ text: 'Data item' }, { text: 'File' }, { text: 'Last modified' }],
    rows: rows.flat()
  }
}
