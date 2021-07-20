describe('Phone number parsing', () => {
  const { parsePhoneNumber, types } = require('../../../../server/lib/contact/phone-number')

  test('parsePhoneNumber returns expected properties', () => {
    const phoneNumber = '07700111222'

    const parsedPhoneNumber = parsePhoneNumber(phoneNumber)

    expect(parsedPhoneNumber).toHaveProperty('original')
    expect(parsedPhoneNumber.original).toEqual(phoneNumber)
    expect(parsedPhoneNumber).toHaveProperty('national')
    expect(parsedPhoneNumber.national).toEqual('07700 111222')
    expect(parsedPhoneNumber).toHaveProperty('international')
    expect(parsedPhoneNumber.international).toEqual('+44 7700 111222')
    expect(parsedPhoneNumber).toHaveProperty('e164')
    expect(parsedPhoneNumber.e164).toEqual('+447700111222')
    expect(parsedPhoneNumber).toHaveProperty('type')
    expect(parsedPhoneNumber.type).toEqual(types.MOBILE)
  })

  test('parsedPhoneNumber works with bad input', () => {
    const phoneNumber = ''

    const parsedPhoneNumber = parsePhoneNumber(phoneNumber)

    expect(parsedPhoneNumber).toHaveProperty('original')
    expect(parsedPhoneNumber.original).toEqual(phoneNumber)
    expect(parsedPhoneNumber).toHaveProperty('national')
    expect(parsedPhoneNumber.national).toEqual(undefined)
    expect(parsedPhoneNumber).toHaveProperty('international')
    expect(parsedPhoneNumber.international).toEqual(undefined)
    expect(parsedPhoneNumber).toHaveProperty('e164')
    expect(parsedPhoneNumber.e164).toEqual(undefined)
    expect(parsedPhoneNumber).toHaveProperty('type')
    expect(parsedPhoneNumber.type).toEqual(types.UNKNOWN)
  })

  test('types returns expected properties', () => {
    expect(types).not.toBe(undefined)
    expect(types).toHaveProperty('MOBILE')
  })
})
