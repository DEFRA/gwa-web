describe('Validating users against schema', () => {
  const validateUsers = require('../../../server/lib/validate-users')
  const user = {
    emailAddress: 'test@abc.com',
    givenName: 'givenName',
    surname: 'surname',
    orgCode: 'ABC',
    orgName: 'alpha',
    officeCode: 'HBD:Home-Based',
    officeLocation: 'Home-Based',
    phoneNumbers: ['+447700111222']
  }

  test('valid users are returned as valid', () => {
    const users = [user]

    const { nonValid, valid } = validateUsers(users)

    expect(nonValid).toHaveLength(0)
    expect(valid).toHaveLength(1)
    const validUser = valid[0]
    expect(validUser).toHaveProperty('emailAddress')
    expect(validUser.emailAddress).toEqual(users[0].emailAddress)
    expect(validUser).toHaveProperty('givenName')
    expect(validUser.givenName).toEqual(users[0].givenName)
    expect(validUser).toHaveProperty('surname')
    expect(validUser.surname).toEqual(users[0].surname)
    expect(validUser).toHaveProperty('officeLocation')
    expect(validUser.officeLocation).toEqual(users[0].officeLocation)
    expect(validUser).toHaveProperty('officeCode')
    expect(validUser.officeCode).toEqual(users[0].officeCode)
    expect(validUser).toHaveProperty('orgCode')
    expect(validUser.orgCode).toEqual(users[0].orgCode)
    expect(validUser).toHaveProperty('orgName')
    expect(validUser.orgName).toEqual(users[0].orgName)
    expect(validUser).toHaveProperty('phoneNumbers')
  })

  test.each([
    ['emailAddress', undefined],
    ['emailAddress', 'not-an-email'],
    ['givenName', undefined],
    ['surname', undefined],
    ['orgCode', undefined],
    ['orgName', undefined],
    ['officeCode', undefined],
    ['officeCode', 'ABCD:incorrect-format'],
    ['officeLocation', undefined],
    ['phoneNumbers', undefined],
    ['phoneNumbers', ['07000111222']],
    ['phoneNumbers', ['07000111222', '07700111222']]
  ])('non-valid users are returned as nonValid with error when property %s is set to %s', (property, value) => {
    const nonValidUser = { ...user }
    nonValidUser[property] = value
    const users = [nonValidUser]

    const { nonValid, valid } = validateUsers(users)

    expect(nonValid).toHaveLength(1)
    expect(valid).toHaveLength(0)

    const nonValidUserResult = nonValid[0].value
    expect(nonValidUserResult).toHaveProperty('emailAddress')
    expect(nonValidUserResult.emailAddress).toEqual(users[0].emailAddress)
    expect(nonValidUserResult).toHaveProperty('givenName')
    expect(nonValidUserResult.givenName).toEqual(users[0].givenName)
    expect(nonValidUserResult).toHaveProperty('surname')
    expect(nonValidUserResult.surname).toEqual(users[0].surname)
    expect(nonValidUserResult).toHaveProperty('officeLocation')
    expect(nonValidUserResult.officeLocation).toEqual(users[0].officeLocation)
    expect(nonValidUserResult).toHaveProperty('officeCode')
    expect(nonValidUserResult.officeCode).toEqual(users[0].officeCode)
    expect(nonValidUserResult).toHaveProperty('orgCode')
    expect(nonValidUserResult.orgCode).toEqual(users[0].orgCode)
    expect(nonValidUserResult).toHaveProperty('orgName')
    expect(nonValidUserResult.orgName).toEqual(users[0].orgName)
    expect(nonValidUserResult).toHaveProperty('phoneNumbers')

    const error = nonValid[0].error
    expect(error).toHaveProperty('_original')
    expect(error).toHaveProperty('details')
    if (property === 'phoneNumbers' && value) {
      expect(error.details[0].context.key).toEqual(0)
    } else {
      expect(error.details[0].context.key).toEqual(property)
    }
  })
})
