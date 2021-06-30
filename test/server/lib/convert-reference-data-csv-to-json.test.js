const { Readable } = require('stream')
const { types } = require('../../../server/lib/reference-data')
const generateOfficeCode = require('../../../server/lib/generate-office-code')

describe('Converting CSV of reference data into JSON for upload', () => {
  const convertReferenceDataCsvToJson = require('../../../server/lib/convert-reference-data-csv-to-json')

  describe(`${types.officeLocations} data`, () => {
    const headers = ['originalOfficeLocation', 'officeLocation', 'areaCode', 'areaName', 'officeCode']
    const type = types.officeLocations
    const originalOfficeLocation = 'originalOfficeLocation'
    const officeLocation = 'office location'
    const areaCode = 'ABC'
    const areaName = 'area name'
    const officeCode = 'any old input'

    test('ideal input of several office locations returns expected output', async () => {
      const stream = Readable.from(`${headers.join()}\n${originalOfficeLocation},${officeLocation},${areaCode},${areaName},${officeCode}`)

      const { data, valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(true)
      expect(data).toHaveLength(1)
      data.forEach(ol => {
        expect(ol).toHaveProperty('originalOfficeLocation')
        expect(ol.originalOfficeLocation).toEqual(originalOfficeLocation)
        expect(ol).toHaveProperty('officeLocation')
        expect(ol.officeLocation).toEqual(officeLocation)
        expect(ol).toHaveProperty('areaCode')
        expect(ol.areaCode).toEqual(areaCode)
        expect(ol).toHaveProperty('areaName')
        expect(ol.areaName).toEqual(areaName)
        expect(ol).toHaveProperty('officeCode')
        expect(ol.officeCode).toEqual(generateOfficeCode({ areaCode, officeLocation }))
      })
    })

    test('altered headers in file return invalid response', async () => {
      const stream = Readable.from(`a,b,c,d,e\n${originalOfficeLocation},${officeLocation},${areaCode},${areaName},${officeCode}`)

      const { valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(false)
    })
  })

  describe(`${types.orgList} data`, () => {
    const headers = ['orgName', 'orgCode', 'active', 'core']
    const type = types.orgList
    const orgName = 'orgName'
    const orgCode = 'orgCode'
    const active = true
    const core = false

    function expectUndefinedOrg (officeLocation) {
      expect(officeLocation.orgCode).toEqual('UFD')
      expect(officeLocation.orgName).toEqual('Undefined')
      expect(officeLocation.active).toEqual(true)
      expect(officeLocation.core).toEqual(false)
    }

    test('input of organisation list returns json along with undefined org', async () => {
      const stream = Readable.from(`${headers.join()}\n${orgName},${orgCode},${active},${core}`)

      const { data, valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(true)
      expect(data).toHaveLength(2)
      data.forEach(ol => {
        expect(ol).toHaveProperty('orgCode')
        expect(ol).toHaveProperty('orgName')
        expect(ol).toHaveProperty('active')
        expect(ol).toHaveProperty('core')
      })
      const officeLocationOne = data[0]
      expect(officeLocationOne.orgCode).toEqual(orgCode)
      expect(officeLocationOne.orgName).toEqual(orgName)
      expect(officeLocationOne.active).toEqual(active)
      expect(officeLocationOne.core).toEqual(core)
      expectUndefinedOrg(data[1])
    })

    test('input including undefined org returns a instance that is active and not core', async () => {
      const stream = Readable.from(`${headers.join()}\nUndefined,UFD,FALSE,TRUE`)

      const { data, valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(true)
      expect(data).toHaveLength(1)
      expectUndefinedOrg(data[0])
    })

    test.each([
      { activeVariant: 'TRUE', coreVariant: 'TRUE' },
      { activeVariant: 'FALSE', coreVariant: 'FALSE' }
    ])('input with capitalised active and core returns expected output', async ({ activeVariant, coreVariant }) => {
      const stream = Readable.from(`${headers.join()}\n${orgName},${orgCode},${activeVariant},${coreVariant}`)

      const { data, valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(true)
      expect(data).toHaveLength(2)
      data.forEach(ol => {
        expect(ol).toHaveProperty('orgCode')
        expect(ol).toHaveProperty('orgName')
        expect(ol).toHaveProperty('active')
        expect(ol).toHaveProperty('core')
      })
      const officeLocationOne = data[0]
      expect(officeLocationOne.orgCode).toEqual(orgCode)
      expect(officeLocationOne.orgName).toEqual(orgName)
      expect(officeLocationOne.active).toEqual(activeVariant.toLowerCase() === 'true')
      expect(officeLocationOne.core).toEqual(coreVariant.toLowerCase() === 'true')
      expectUndefinedOrg(data[1])
    })

    test('altered headers in file return invalid response', async () => {
      const stream = Readable.from(`a,b,c,d\n${orgName},${orgCode},${active},${core}`)

      const { valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(false)
    })

    test('no user data returns undefined org', async () => {
      const stream = Readable.from('\n')

      const { data, valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(true)
      expect(data).toHaveLength(1)
      expectUndefinedOrg(data[0])
    })
  })

  describe(`${types.orgMap} data`, () => {
    const headers = ['originalOrgName', 'orgName', 'orgCode']
    const type = types.orgMap
    const originalOrgName = 'originalOrgName'
    const orgName = 'orgName'
    const orgCode = 'ABC'

    test('ideal input of several office locations returns expected output', async () => {
      const stream = Readable.from(`${headers.join()}\n${originalOrgName},${orgName},${orgCode}`)

      const { data, valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(true)
      expect(data).toHaveLength(1)
      data.forEach(ol => {
        expect(ol).toHaveProperty('originalOrgName')
        expect(ol.originalOrgName).toEqual(originalOrgName)
        expect(ol).toHaveProperty('orgName')
        expect(ol.orgName).toEqual(orgName)
        expect(ol).toHaveProperty('orgCode')
        expect(ol.orgCode).toEqual(orgCode)
      })
    })

    test('altered headers in file return invalid response', async () => {
      const stream = Readable.from(`a,b,c\n${originalOrgName},${orgName},${orgCode}`)

      const { valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(valid).toEqual(false)
    })
  })

  describe('generic tests', () => {
    test.each([
      { type: types.officeLocations },
      { type: types.orgMap }
    ])('no user data - %o', async ({ type }) => {
      const stream = Readable.from('\n')

      const { data, valid } = await convertReferenceDataCsvToJson(stream, type)

      expect(data).toHaveLength(0)
      expect(valid).toEqual(false)
    })

    test('result is not valid when type is not matched', async () => {
      const stream = Readable.from('\n')
      const type = 'unknown'

      const res = await convertReferenceDataCsvToJson(stream, type)

      expect(res).toHaveProperty('valid')
      expect(res.valid).toEqual(false)
      expect(res).not.toHaveProperty('data')
    })
  })
})
