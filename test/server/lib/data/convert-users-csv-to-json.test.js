const { Readable } = require('stream')
const { officeLocationMappings } = require('../../../../server/constants')
const { parsePhoneNumber } = require('../../../../server/lib/contact/phone-number')

describe('Converting CSV of user data into JSON for upload', () => {
  const convertCSVToJSON = require('../../../../server/lib/data/convert-users-csv-to-json')
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
  const organisation = { orgCode, orgName }
  const officeLocationMap = [{ originalOfficeLocation, officeLocation, officeCode }]

  test('ideal input of several users returns expected output', async () => {
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${originalOfficeLocation},${inputPhoneNumber}\n${emailAddress},${givenName},${surname},${originalOfficeLocation},${inputPhoneNumber}`)

    const users = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(2)
    users.forEach(user => {
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
      expect(user).toHaveProperty('phoneNumbers')
      expect(user.phoneNumbers).toEqual([outputPhoneNumber])
      expect(user).not.toHaveProperty('phoneNumber')
    })
  })

  test('unmapped office location is mapped correctly', async () => {
    const unmappedOfficeLocation = 'not-mapped'
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${unmappedOfficeLocation},${inputPhoneNumber}`)

    const users = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    expect(users[0]).toHaveProperty('officeLocation')
    expect(users[0].officeLocation).toEqual(officeLocationMappings.unmappedOfficeLocation)
    expect(users[0]).toHaveProperty('officeCode')
    expect(users[0].officeCode).toEqual(officeLocationMappings.unmappedOfficeCode)
  })

  test('email addres is lowercased', async () => {
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress.toUpperCase()},${givenName},${surname},${officeLocation},${inputPhoneNumber}`)

    const users = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    expect(users[0].emailAddress).toEqual(emailAddress)
  })

  test('no user data', async () => {
    const stream = Readable.from('\n')

    const users = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(0)
  })

  test('the minimum amount of completely wrong user data', async () => {
    const stream = Readable.from('a\na')

    const users = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    const user = users[0]
    expect(user).toHaveProperty('emailAddress')
    expect(user.emailAddress).toEqual('a')
    expect(user).not.toHaveProperty('givenName')
    expect(user).not.toHaveProperty('surname')
    expect(user).toHaveProperty('officeLocation')
    expect(user.officeLocation).toEqual(officeLocationMappings.unmappedOfficeLocation)
    expect(user).toHaveProperty('officeCode')
    expect(user.officeCode).toEqual(officeLocationMappings.unmappedOfficeCode)
    expect(user).toHaveProperty('orgCode')
    expect(user.orgCode).toEqual(orgCode)
    expect(user).toHaveProperty('orgName')
    expect(user.orgName).toEqual(orgName)
    expect(user).toHaveProperty('phoneNumbers')
    expect(user.phoneNumbers).toEqual([undefined])
    expect(user).not.toHaveProperty('phoneNumber')
  })

  test('completely wrong user data', async () => {
    const stream = Readable.from('a,b,c,d,e\na,b,c,d,e')

    const users = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    const user = users[0]
    expect(user).toHaveProperty('emailAddress')
    expect(user.emailAddress).toEqual('a')
    expect(user).toHaveProperty('givenName')
    expect(user.givenName).toEqual('b')
    expect(user).toHaveProperty('surname')
    expect(user.surname).toEqual('c')
    expect(user).toHaveProperty('officeLocation')
    expect(user.officeLocation).toEqual(officeLocationMappings.unmappedOfficeLocation)
    expect(user).toHaveProperty('officeCode')
    expect(user.officeCode).toEqual(officeLocationMappings.unmappedOfficeCode)
    expect(user).toHaveProperty('orgCode')
    expect(user.orgCode).toEqual(orgCode)
    expect(user).toHaveProperty('orgName')
    expect(user.orgName).toEqual(orgName)
    expect(user).toHaveProperty('phoneNumbers')
    expect(user.phoneNumbers).toEqual([undefined])
    expect(user).not.toHaveProperty('phoneNumber')
  })

  test.each([
    ['+447700111222'],
    ['07000111222'],
    ['01234567890']
  ])('e164 formatted phone number is returned - %s', async (phoneNumber) => {
    const stream = Readable.from(`emailAddress,givenName,surname,officeLocation,phoneNumber\n${emailAddress},${givenName},${surname},${officeLocation},${phoneNumber}`)

    const users = await convertCSVToJSON(stream, organisation, officeLocationMap)

    expect(users).toHaveLength(1)
    expect(users[0].phoneNumbers).toEqual([parsePhoneNumber(phoneNumber).e164])
  })
})
