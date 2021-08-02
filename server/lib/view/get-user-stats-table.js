const { getUserStats } = require('../db')

function sortRowsByOrgCode (a, b) {
  const aOrgCode = a[0].text
  const bOrgCode = b[0].text
  if (aOrgCode < bOrgCode) { return -1 }
  if (aOrgCode > bOrgCode) { return 1 }
  return 0
}

async function getPhoneNumberBlobAsRows () {
  const results = await getUserStats()
  const orgs = new Map()
  results.forEach(x => {
    const org = orgs.get(x.orgCode)
    const prop = x.active ? 'active' : 'inactive'
    if (org) {
      org[prop] = x.count
    } else {
      const data = { }
      data[prop] = x.count
      orgs.set(x.orgCode, data)
    }
  })
  const rows = []
  for (const [key, val] of orgs.entries()) {
    rows.push([
      { text: key },
      { text: val.active ?? 0 },
      { text: val.inactive ?? 0 }
    ])
  }
  rows.sort(sortRowsByOrgCode)
  return rows
}

/**
 * Gets all the data required and returns an object ready to be used in the
 * [GOV.UK table](https://design-system.service.gov.uk/components/table/)
 * component for user stats.
 * The table will include counts for active and inative users.
 *
 * @return {object} including `head` and `rows` to be used in to GOV.UK table.
 */
module.exports = async () => {
  return {
    head: [{ text: 'Organisation' }, { text: 'Active users' }, { text: 'Inactive users' }],
    rows: await getPhoneNumberBlobAsRows()
  }
}
