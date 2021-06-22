const types = {
  officeLocations: 'office-locations',
  orgList: 'org-list',
  orgMap: 'org-map'
}

const typeInfo = {
  [types.officeLocations]: {
    blurb: '',
    download: 'office-locations-reference-data.csv',
    filename: 'office-locations',
    heading: 'Manage office locations reference data'
  },
  [types.orgList]: {
    blurb: '',
    download: 'organisation-list-reference-data.csv',
    filename: 'org-list',
    heading: 'Manage organisation list reference data'
  },
  [types.orgMap]: {
    blurb: 'The downloaded file will include columns: <strong>originalOrgName</strong>, <strong>orgName</strong> and <strong>orgCode</strong>. When editing the data, either by updating existing rows or adding new rows, <strong>orgName</strong> will be ignored when the file is uploaded. The column only exists in the file to help identify which organisation the code belongs to. <strong>orgCode</strong> is used to create the mapping to the correct organisation.',
    download: 'organisation-map-reference-data.csv',
    filename: 'org-map',
    heading: 'Manage organisation map reference data'
  }
}

module.exports = {
  typeInfo,
  types
}
