describe('Converting users from JSON to CSV', () => {
  const convertUsersJSONToCSV = require('../../../../server/lib/data/convert-users-json-to-csv')

  const emailAddress = 'a@b.com'
  const givenName = 'givenName'
  const surname = 'surname'
  const officeLocation = 'officeLocation'
  const orgCode = 'orgCode'
  const orgName = 'orgName'
  const officeCode = 'ABC:officeLocation'
  const phoneNumbers = ['+447700111222']
  const user = {
    emailAddress,
    givenName,
    surname,
    officeLocation,
    orgCode,
    orgName,
    officeCode,
    phoneNumbers
  }

  test('only required fields are returned', async () => {
    const users = [user]
    const jsonData = JSON.stringify(users)

    const csvData = await convertUsersJSONToCSV(jsonData)

    const lines = csvData.split('\n')
    expect(lines).toHaveLength(users.length + 1)
    expect(lines[0]).toEqual('"emailAddress","givenName","surname","officeLocation","phoneNumber"')
    expect(lines[1]).toEqual(`"${emailAddress}","${givenName}","${surname}","${officeLocation}","${phoneNumbers[0]}"`)
  })

  test('only single phone number is returned', async () => {
    const twoPhoneNumbers = ['+447700333444', phoneNumbers[0]]
    const userTwo = { ...user, phoneNumbers: twoPhoneNumbers }
    const users = [userTwo]
    const jsonData = JSON.stringify(users)

    const csvData = await convertUsersJSONToCSV(jsonData)

    const lines = csvData.split('\n')
    expect(lines).toHaveLength(users.length + 1)
    expect(lines[0]).toEqual('"emailAddress","givenName","surname","officeLocation","phoneNumber"')
    expect(lines[1]).toEqual(`"${emailAddress}","${givenName}","${surname}","${officeLocation}","${twoPhoneNumbers[0]}"`)
  })

  test('multiple users with differing numbers of phone numbers are returned', async () => {
    const twoPhoneNumbers = ['+447700333444', phoneNumbers[0]]
    const userTwo = { ...user, phoneNumbers: twoPhoneNumbers }
    const userZero = { ...user, phoneNumbers: [] }
    const users = [user, userTwo, userZero]
    const jsonData = JSON.stringify(users)

    const csvData = await convertUsersJSONToCSV(jsonData)

    const lines = csvData.split('\n')
    expect(lines).toHaveLength(users.length + 1)
    expect(lines[0]).toEqual('"emailAddress","givenName","surname","officeLocation","phoneNumber"')
    expect(lines[1]).toEqual(`"${emailAddress}","${givenName}","${surname}","${officeLocation}","${phoneNumbers[0]}"`)
    expect(lines[2]).toEqual(`"${emailAddress}","${givenName}","${surname}","${officeLocation}","${twoPhoneNumbers[0]}"`)
    expect(lines[3]).toEqual(`"${emailAddress}","${givenName}","${surname}","${officeLocation}",""`)
  })
})
