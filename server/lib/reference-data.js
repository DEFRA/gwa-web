const { referenceData } = require('../constants')

const types = {
  officeLocations: 'office-locations',
  orgList: 'org-list',
  orgMap: 'org-map'
}

const ids = {
  [types.officeLocations]: referenceData.standardisedOfficeLocationMap,
  [types.orgList]: referenceData.organisationList,
  [types.orgMap]: referenceData.organisationMap
}

const typeInfo = {
  [types.officeLocations]: {
    blurb: 'The downloaded file will include columns: <strong>originalOfficeLocation</strong>, <strong>officeLocation</strong>, <strong>areaCode</strong>, <strong>areaName</strong> and <strong>officeCode</strong>.' +
    '<br>The key columns are <strong>originalOfficeLocation</strong> (this is the representation of the office location that should be mapped from), <strong>officeLocation</strong> (is the value of the office location that should be mapped to), <strong>areaCode</strong> (represents the area the office is in) and <strong>areaName</strong> (the name of the area the office is in).' +
    '<br>It is important the value entered for <strong>areaName</strong> across all instances of the <strong>areaCode</strong> is the same. If this is not the case, there may be issues with matching areas.' +
    '<br><strong>officeCode</strong> is a generated value and will be ignored during the upload.',
    download: 'office-locations-reference-data.csv',
    filename: 'office-locations',
    heading: 'office locations'
  },
  [types.orgList]: {
    blurb: 'The downloaded file will include columns: <strong>orgName</strong>, <strong>orgCode</strong>, <strong>active</strong> and <strong>core</strong>.' +
    '<br><strong>active</strong>, in combination with <strong>core</strong> determines if the organisation is available as an option for <a href="/upload" class="govuk-link">uploading data to</a>. Organisations set as <strong>core=true</strong> will not appear in the list and therefore can not have files uploaded to act as their data source.' +
    '<br><strong>active</strong>, on its own determines whether the organisation appears in the list of organisations to send messages to.' +
    '<br>This data is unlikely to need to change frequently. Scenarios that would require changes to the data include:' +
    '<ul class="govuk-list govuk-list--bullet">' +
    '<li>Adding a new organisation</li>' +
    '<li>Setting an organsation to active in order to upload data</li>' +
    '</ul>',
    download: 'organisation-list-reference-data.csv',
    filename: 'org-list',
    heading: 'organisation list'
  },
  [types.orgMap]: {
    blurb: 'The downloaded file will include columns: <strong>originalOrgName</strong>, <strong>orgName</strong> and <strong>orgCode</strong>.' +
    '<br>When editing the data, either by updating existing rows or adding new rows, <strong>orgName</strong> will be ignored when the file is uploaded. The column only exists in the download to help identify which organisation the code belongs to. <strong>orgCode</strong> is used to create the mapping to the correct organisation.',
    download: 'organisation-map-reference-data.csv',
    filename: 'org-map',
    heading: 'organisation map'
  }
}

module.exports = {
  ids,
  typeInfo,
  types
}
