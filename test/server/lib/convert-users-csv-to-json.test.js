const { Readable } = require('stream')
const { v5: uuidv5 } = require('uuid')
const { officeLocationMappings } = require('../../../server/constants')

describe('Converting CSV of user data into JSON for upload', () => {
  const convertCSVToJSON = require('../../../server/lib/convert-users-csv-to-json')
  const emailAddress = 'test-gwa@defra.gov.uk'
  const givenName = 'givenName'
  const surname = 'surname'
  const officeLocation = 'Home'
  const originalOfficeLocation = 'home based'
  const officeCode = 'HBD:Home-Based'
  const phoneNumber = '07000111222'
  const orgCode = 'DFT'
  const orgName = 'Department for things'
  const officeLocationMap = [{ originalOfficeLocation, officeLocation, officeCode }]

  test('ideal input returns expected output', async () => {
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${originalOfficeLocation},${phoneNumber}`)
    const organisation = { orgCode, orgName }

    const { users } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    expect(users[0]).toHaveProperty('id')
    expect(users[0].id).toEqual(uuidv5(emailAddress, uuidv5.URL))
    expect(users[0]).toHaveProperty('emailAddress')
    expect(users[0].emailAddress).toEqual(emailAddress)
    expect(users[0]).toHaveProperty('givenName')
    expect(users[0].givenName).toEqual(givenName)
    expect(users[0]).toHaveProperty('surname')
    expect(users[0].surname).toEqual(surname)
    expect(users[0]).toHaveProperty('officeLocation')
    expect(users[0].officeLocation).toEqual(officeLocation)
    expect(users[0]).toHaveProperty('officeCode')
    expect(users[0].officeCode).toEqual(officeCode)
    expect(users[0]).toHaveProperty('orgCode')
    expect(users[0].orgCode).toEqual(orgCode)
    expect(users[0]).toHaveProperty('orgName')
    expect(users[0].orgName).toEqual(orgName)
    expect(users[0]).toHaveProperty('phoneNumber')
    expect(users[0].phoneNumber).toEqual(phoneNumber)
  })

  test('unmapped office location is mapped correctly', async () => {
    const unmappedOfficeLocation = 'not-mapped'
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${unmappedOfficeLocation},${phoneNumber}`)
    const organisation = { orgCode, orgName }

    const { users } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    expect(users[0]).toHaveProperty('officeLocation')
    expect(users[0].officeLocation).toEqual(officeLocationMappings.unmappedOfficeLocation)
    expect(users[0]).toHaveProperty('officeCode')
    expect(users[0].officeCode).toEqual(officeLocationMappings.unmappedOfficeCode)
  })

  test('non UK mobile phone number is rejected', async () => {
    const unmappedOfficeLocation = 'not-mapped'
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${unmappedOfficeLocation},${phoneNumber}`)
    const organisation = { orgCode, orgName }

    const { users } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    expect(users[0]).toHaveProperty('officeLocation')
    expect(users[0].officeLocation).toEqual(officeLocationMappings.unmappedOfficeLocation)
    expect(users[0]).toHaveProperty('officeCode')
    expect(users[0].officeCode).toEqual(officeLocationMappings.unmappedOfficeCode)
  })
})
