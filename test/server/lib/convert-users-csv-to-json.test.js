const { Readable } = require('stream')
const { v5: uuidv5 } = require('uuid')
const { officeLocationMappings } = require('../../../server/constants')
const { parsePhoneNumber } = require('../../../server/lib/phone-number')

describe('Converting CSV of user data into JSON for upload', () => {
  const convertCSVToJSON = require('../../../server/lib/convert-users-csv-to-json')
  const emailAddress = 'test-gwa@defra.gov.uk'
  const givenName = 'givenName'
  const surname = 'surname'
  const officeLocation = 'Home'
  const originalOfficeLocation = 'home based'
  const officeCode = 'HBD:Home-Based'
  const inputPhoneNumber = '07700111222'
  const outputPhoneNumber = parsePhoneNumber(inputPhoneNumber).e164
  const orgCode = 'DFT'
  const orgName = 'Department for things'
  const officeLocationMap = [{ originalOfficeLocation, officeLocation, officeCode }]

  test('ideal input returns expected output', async () => {
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${originalOfficeLocation},${inputPhoneNumber}`)
    const organisation = { orgCode, orgName }

    const { error, valid } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(valid).toHaveLength(1)
    expect(error).toHaveLength(0)
    expect(valid[0]).toHaveProperty('id')
    expect(valid[0].id).toEqual(uuidv5(emailAddress, uuidv5.URL))
    expect(valid[0]).toHaveProperty('emailAddress')
    expect(valid[0].emailAddress).toEqual(emailAddress)
    expect(valid[0]).toHaveProperty('givenName')
    expect(valid[0].givenName).toEqual(givenName)
    expect(valid[0]).toHaveProperty('surname')
    expect(valid[0].surname).toEqual(surname)
    expect(valid[0]).toHaveProperty('officeLocation')
    expect(valid[0].officeLocation).toEqual(officeLocation)
    expect(valid[0]).toHaveProperty('officeCode')
    expect(valid[0].officeCode).toEqual(officeCode)
    expect(valid[0]).toHaveProperty('orgCode')
    expect(valid[0].orgCode).toEqual(orgCode)
    expect(valid[0]).toHaveProperty('orgName')
    expect(valid[0].orgName).toEqual(orgName)
    expect(valid[0]).toHaveProperty('phoneNumber')
    expect(valid[0].phoneNumber).toEqual(outputPhoneNumber)
  })

  test('unmapped office location is mapped correctly', async () => {
    const unmappedOfficeLocation = 'not-mapped'
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${unmappedOfficeLocation},${inputPhoneNumber}`)
    const organisation = { orgCode, orgName }

    const { error, valid } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(valid).toHaveLength(1)
    expect(error).toHaveLength(0)
    expect(valid[0]).toHaveProperty('officeLocation')
    expect(valid[0].officeLocation).toEqual(officeLocationMappings.unmappedOfficeLocation)
    expect(valid[0]).toHaveProperty('officeCode')
    expect(valid[0].officeCode).toEqual(officeLocationMappings.unmappedOfficeCode)
  })

  test('e164 formatted UK mobile phone number is accepted', async () => {
    const unmappedOfficeLocation = 'not-mapped'
    const e164FormattedUKPhoneNumber = '+447700111222'
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${unmappedOfficeLocation},${e164FormattedUKPhoneNumber}`)
    const organisation = { orgCode, orgName }

    const { error, valid } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(valid).toHaveLength(1)
    expect(error).toHaveLength(0)
  })

  test('non UK mobile phone number is rejected', async () => {
    const unmappedOfficeLocation = 'not-mapped'
    const nonUKMobilePhoneNumber = '07000111222'
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${unmappedOfficeLocation},${nonUKMobilePhoneNumber}`)
    const organisation = { orgCode, orgName }

    const { error, valid } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(valid).toHaveLength(0)
    expect(error).toHaveLength(1)
  })
})
