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

  test('ideal input of several users returns expected output', async () => {
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${originalOfficeLocation},${inputPhoneNumber}\n${emailAddress},${givenName},${surname},${originalOfficeLocation},${inputPhoneNumber}`)
    const organisation = { orgCode, orgName }

    const { error, valid } = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(valid).toHaveLength(2)
    expect(error).toHaveLength(0)
    valid.forEach(user => {
      expect(user).toHaveProperty('id')
      expect(user.id).toEqual(uuidv5(emailAddress, uuidv5.URL))
      expect(user).toHaveProperty('emailAddress')
      expect(user.emailAddress).toEqual(emailAddress)
      expect(user).toHaveProperty('givenName')
      expect(user.givenName).toEqual(givenName)
      expect(user).toHaveProperty('surname')
      expect(user.surname).toEqual(surname)
      expect(user).toHaveProperty('officeLocation')
      expect(user.officeLocation).toEqual(officeLocation)
      expect(user).toHaveProperty('officeCode')
      expect(user.officeCode).toEqual(officeCode)
      expect(user).toHaveProperty('orgCode')
      expect(user.orgCode).toEqual(orgCode)
      expect(user).toHaveProperty('orgName')
      expect(user.orgName).toEqual(orgName)
      expect(user).toHaveProperty('phoneNumber')
      expect(user.phoneNumber).toEqual(outputPhoneNumber)
    })
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
