const fetch = require('node-fetch')
const { getComponentTag, getServiceTag } = require('./helpers')

/**
 * Get the status summary of GOV.UK Notify.
 *
 * @returns {object} the data from
 * https://status.notifications.service.gov.uk/api/v2/summary.json including an
 * additional property `_lastChecked` to indicate when the request was made.
 */
async function getNotifyStatus () {
  const url = 'https://status.notifications.service.gov.uk/api/v2/summary.json'
  const response = await fetch(url)
  const data = await response.json()

  data.lastChecked = Date.now()
  return data
}

/**
 * Formats the GOV.UK Notify status data for use in the `notify-status`
 * partial.
 */
module.exports = async () => {
  const data = await getNotifyStatus()
  const componentRows = data.components.map(c => {
    return [
      { text: c.name },
      { html: `<strong class="govuk-tag ${getComponentTag(c.status)}">${c.status}</strong>` }
    ]
  })
  return {
    service: {
      description: data.status.description,
      tag: getServiceTag(data.status.indicator)
    },
    componentRows,
    lastChecked: new Date(data.lastChecked).toLocaleString()
  }
}
