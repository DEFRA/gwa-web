const generateOfficeCode = require('../../../server/lib/generate-office-code')

describe('Generating office code', () => {
  test.each([
    { areaCode: 'abc', officeLocation: 'capitalised areaCode office', expected: 'ABC:capitalised-areaCode-office' },
    { areaCode: 'AbC', officeLocation: '---dashing----my----hopes---', expected: 'ABC:dashing-my-hopes' },
    { areaCode: 'abc', officeLocation: '   trim   this   place   ', expected: 'ABC:trim-this-place' },
    { areaCode: 'aBc', officeLocation: '123 number wang 321', expected: 'ABC:123-number-wang-321' },
    { areaCode: 'aBCde', officeLocation: 'colon:in officeLocation', expected: 'ABCDE:colon-in-officeLocation' }
  ])('office code is generated as expected', ({ areaCode, officeLocation, expected }) => {
    const office = { areaCode, officeLocation }

    const res = generateOfficeCode(office)

    expect(res).toEqual(expected)
  })
})
