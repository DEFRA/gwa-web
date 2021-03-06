const { referenceData } = require('../../constants')

const types = {
  officeLocations: 'office-locations',
  orgList: 'org-list',
  orgMap: 'org-map'
}

const typeInfo = {
  [types.officeLocations]: {
    id: referenceData.standardisedOfficeLocationMap,
    blurb: 'The downloaded file will include columns: <strong>originalOfficeLocation</strong>, <strong>officeLocation</strong>, <strong>areaCode</strong>, <strong>areaName</strong> and <strong>officeCode</strong>.' +
    '<br>The key columns are <strong>originalOfficeLocation</strong> (this is the representation of the office location that should be mapped from), <strong>officeLocation</strong> (is the value of the office location that should be mapped to), <strong>areaCode</strong> (represents the area the office is in) and <strong>areaName</strong> (the name of the area the office is in).' +
    '<br>It is important the value entered for <strong>areaName</strong> across all instances of the <strong>areaCode</strong> is the same. If this is not the case, there may be issues with matching areas.' +
    '<br><strong>officeCode</strong> is a generated value and will be ignored during the upload.',
    download: 'office-locations-reference-data.csv',
    filename: 'office-locations',
    heading: 'office locations',
    headers: ['originalOfficeLocation', 'officeLocation', 'areaCode', 'areaName', 'officeCode']
  },
  [types.orgList]: {
    id: referenceData.organisationList,
    blurb: '<p>When the file is uploaded an import of user data will be triggered. This will normally complete within 10 minutes and is confirmed upon receipt of the \'import report\' email or checking the time the \'phone-numbers.csv\' file was last modified on the <a href="/system-status">system status</a> page.</p>' +
      '<p>The downloaded file will include columns: <strong>orgName</strong>, <strong>orgCode</strong>, <strong>active</strong> and <strong>core</strong>.</p>' +
      '<p><strong>active</strong>, in combination with <strong>core</strong> determines if the organisation is available as an option for <a href="/org-data-upload">uploading data to</a>. Organisations set as <strong>core=true</strong> will not appear in the list and therefore can not have files uploaded to act as their data source.</p>' +
      '<p><strong>active</strong>, on its own determines whether the organisation appears in the list of organisations to send messages to.<br>It also determines if users of that organisation are active within the system. When an organisation is set to inactive all users of that organisation will be unable to login to the system or receive messages.</p>' +
    '<p>' +
      'This data is unlikely to need to change frequently. Scenarios that would require changes to the data include:' +
      '<ul class="govuk-list govuk-list--bullet">' +
        '<li>Adding a new organisation</li>' +
        '<li>Changing an organsation\'s active state</li>' +
      '</ul>' +
    '</p>',
    download: 'organisation-list-reference-data.csv',
    filename: 'org-list',
    heading: 'organisation list',
    headers: ['orgName', 'orgCode', 'active', 'core']
  },
  [types.orgMap]: {
    id: referenceData.organisationMap,
    blurb: 'The downloaded file will include columns: <strong>originalOrgName</strong>, <strong>orgName</strong> and <strong>orgCode</strong>.' +
    '<br>When editing the data, either by updating existing rows or adding new rows, <strong>orgName</strong> will be ignored when the file is uploaded. The column only exists in the download to help identify which organisation the code belongs to. <strong>orgCode</strong> is used to create the mapping to the correct organisation.',
    download: 'organisation-map-reference-data.csv',
    filename: 'org-map',
    heading: 'organisation map',
    headers: ['originalOrgName', 'orgName', 'orgCode']
  }
}

module.exports = {
  typeInfo,
  types
}
