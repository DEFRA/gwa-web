const types = {
  officeLocations: 'office-locations',
  orgList: 'org-list',
  orgMap: 'org-map'
}

const typeInfo = {
  [types.officeLocations]: {
    blurb: 'The downloaded file will include columns: <strong>originalOfficeLocation</strong>, <strong>officeLocation</strong>, <strong>areaCode</strong>, <strong>areaName</strong> and <strong>officeCode</strong>.' +
    '<br>The key columns are <strong>originalOfficeLocation</strong> (this is the representation of the office location that should be mapped from), <strong>officeLocation</strong> (is the value of the office location that should be mapped to), <strong>areaCode</strong> (represents the area the office is in) and <strong>areaName</strong> (the name of the area the office is in).' +
    '<br>It is important the value entered for <strong>areaName</strong> across all instances of the <strong>areaCode</strong> is the same. If this is not the case, there may be issues with matching areas.' +
    '<br><strong>officeCode</strong> is a generated value and will be ignored during the upload.',
    download: 'office-locations-reference-data.csv',
    filename: 'office-locations',
    heading: 'Manage office locations reference data'
  },
  [types.orgList]: {
    blurb: 'The downloaded file will include columns: <strong>orgName</strong>, <strong>orgCode</strong>, <strong>active</strong> and <strong>core</strong>.' +
    '<br><strong>active</strong> determines if this organisation is available for uploading data to, in combination with <strong>core</strong>. Organisations set as core=true can not have additional files used as the data source. <strong>active</strong> also determines whether the organisation appears in the list of organisations to send messages to.',
    download: 'organisation-list-reference-data.csv',
    filename: 'org-list',
    heading: 'Manage organisation list reference data'
  },
  [types.orgMap]: {
    blurb: 'The downloaded file will include columns: <strong>originalOrgName</strong>, <strong>orgName</strong> and <strong>orgCode</strong>.' +
    '<br>When editing the data, either by updating existing rows or adding new rows, <strong>orgName</strong> will be ignored when the file is uploaded. The column only exists in the download to help identify which organisation the code belongs to. <strong>orgCode</strong> is used to create the mapping to the correct organisation.',
    download: 'organisation-map-reference-data.csv',
    filename: 'org-map',
    heading: 'Manage organisation map reference data'
  }
}

module.exports = {
  typeInfo,
  types
}
