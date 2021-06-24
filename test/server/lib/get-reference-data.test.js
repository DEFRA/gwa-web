const csvtojson = require('csvtojson')

describe('Get organisation list CSV file', () => {
  const { getOrganisationListCSV, getOrganisationMapCSV, getStandardisedOfficeLocationMap } = require('../../../server/lib/get-reference-data')

  test('JSON array is converted into CSV - getOrganisationListCSV', async () => {
    const organisationList = [{
      orgName: 'org name one',
      orgCode: 'ONONE',
      active: true,
      core: false
    }, {
      orgName: 'org name two',
      orgCode: 'ONTWO',
      active: false,
      core: true
    }]

    const fileContents = await getOrganisationListCSV(organisationList)

    const data = await csvtojson({
      colParser: {
        active: item => item === 'true',
        core: item => item === 'true'
      }
    }).fromString(fileContents)

    expect(data).toHaveLength(2)
    data.forEach((d, i) => {
      expect(d).toHaveProperty('orgName')
      expect(d.orgName).toEqual(organisationList[i].orgName)
      expect(d).toHaveProperty('orgCode')
      expect(d.orgCode).toEqual(organisationList[i].orgCode)
      expect(d).toHaveProperty('active')
      expect(d.active).toEqual(organisationList[i].active)
      expect(d).toHaveProperty('core')
      expect(d.core).toEqual(organisationList[i].core)
    })
  })

  test('JSON array is converted into CSV - getOrganisationMapCSV', async () => {
    const organisationMap = [{
      originalOrgName: 'originalOrgName',
      orgName: 'orgName',
      orgCode: 'orgCode'
    }, {
      originalOrgName: 'originalOrgName, two',
      orgName: 'orgName two',
      orgCode: 'orgCode two'
    }]

    const fileContents = await getOrganisationMapCSV(organisationMap)

    const data = await csvtojson().fromString(fileContents)

    expect(data).toHaveLength(2)
    data.forEach((d, i) => {
      expect(d).toHaveProperty('originalOrgName')
      expect(d.originalOrgName).toEqual(organisationMap[i].originalOrgName)
      expect(d).toHaveProperty('orgCode')
      expect(d.orgCode).toEqual(organisationMap[i].orgCode)
      expect(d).toHaveProperty('orgName')
      expect(d.orgName).toEqual(organisationMap[i].orgName)
    })
  })

  test('JSON array is converted into CSV - getStandardisedOfficeLocationMap', async () => {
    const officeLocationMap = [{
      originalOfficeLocation: 'originalOfficeLocation',
      officeLocation: 'officeLocation',
      areaCode: 'areaCode',
      areaName: 'areaName',
      officeCode: 'officeCode'
    }, {
      originalOfficeLocation: 'originalOfficeLocation, two',
      officeLocation: 'officeLocation two',
      areaCode: 'areaCode two',
      areaName: 'areaName two',
      officeCode: 'officeCode two'
    }]

    const fileContents = await getStandardisedOfficeLocationMap(officeLocationMap)

    const data = await csvtojson().fromString(fileContents)

    expect(data).toHaveLength(2)
    data.forEach((d, i) => {
      expect(d).toHaveProperty('originalOfficeLocation')
      expect(d.originalOfficeLocation).toEqual(officeLocationMap[i].originalOfficeLocation)
      expect(d).toHaveProperty('officeLocation')
      expect(d.officeLocation).toEqual(officeLocationMap[i].officeLocation)
      expect(d).toHaveProperty('areaCode')
      expect(d.areaCode).toEqual(officeLocationMap[i].areaCode)
      expect(d).toHaveProperty('areaName')
      expect(d.areaName).toEqual(officeLocationMap[i].areaName)
      expect(d).toHaveProperty('officeCode')
      expect(d.officeCode).toEqual(officeLocationMap[i].officeCode)
    })
  })
})
