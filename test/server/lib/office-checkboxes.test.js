const cheerio = require('cheerio')

const areaCode1 = 'AC1'
const areaCode2 = 'AC2'

describe('Generate office checkboxes', () => {
  const areaToOfficeMap = [{
    areaCode: areaCode1,
    areaName: 'areaName1',
    officeLocations: [{
      officeCode: `${areaCode1}:office1`,
      officeLocation: 'office1'
    }, {
      officeCode: `${areaCode1}:office2`,
      officeLocation: 'office2'
    }]
  }, {
    areaCode: areaCode2,
    areaName: 'areaName2',
    officeLocations: [{
      officeCode: `${areaCode2}:office1`,
      officeLocation: 'office1'
    }, {
      officeCode: `${areaCode2}:office2`,
      officeLocation: 'office2'
    }]
  }]

  let generateOfficeCheckboxes

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    generateOfficeCheckboxes = require('../../../server/lib/office-checkboxes')
  })

  test('all offices within an area are returned as checkboxes for several areas including the all option for the area', async () => {
    const checkboxes = await generateOfficeCheckboxes(areaToOfficeMap)

    expect(checkboxes).toHaveLength(areaToOfficeMap.length)
    checkboxes.forEach((cb, i) => {
      const areaToOfficeMapData = areaToOfficeMap[i]
      expect(cb).toHaveProperty('expanded')
      expect(cb.expanded).toEqual(false)
      expect(cb).toHaveProperty('heading')
      expect(cb.heading).toEqual({ text: areaToOfficeMapData.areaName })
      expect(cb).toHaveProperty('content')
      expect(cb.content).toHaveProperty('html')

      const $ = cheerio.load(cb.content.html)
      const actualCheckboxes = $('div.govuk-checkboxes__item')
      expect(actualCheckboxes).toHaveLength(3)
      // All area option
      expect($('input', actualCheckboxes[0]).attr('id')).toEqual(`officeLocations_${areaToOfficeMapData.areaCode}:*`)
      expect($('input', actualCheckboxes[0]).attr('name')).toEqual('officeCodes')
      expect($('input', actualCheckboxes[0]).attr('value')).toEqual(`${areaToOfficeMapData.areaCode}:*`)
      expect($('label', actualCheckboxes[0]).attr('for')).toEqual(`officeLocations_${areaToOfficeMapData.areaCode}:*`)
      expect($('label', actualCheckboxes[0]).html()).toEqual(`All office locations in the <strong>${areaToOfficeMapData.areaName}</strong> area`)
      // Individual office locations
      actualCheckboxes.splice(1).forEach((el, j) => {
        const expectedAreaCode = areaToOfficeMapData.areaCode
        const expectedOfficeLocation = areaToOfficeMapData.officeLocations[j].officeLocation
        const expectedVal = `${expectedAreaCode}:${expectedOfficeLocation}`
        expect($('input', el).attr('id')).toEqual(`officeLocations_${expectedVal}`)
        expect($('input', el).attr('name')).toEqual('officeCodes')
        expect($('input', el).attr('value')).toEqual(expectedVal)
        expect($('label', el).attr('for')).toEqual(`officeLocations_${expectedAreaCode}:${expectedOfficeLocation}`)
        expect($('label', el).html()).toEqual(expectedOfficeLocation)
      })
    })
  })

  test('when an area is identified as checked, no offices within the area are checked and it is expanded', async () => {
    const checked = [`${areaCode1}:*`]

    const checkboxes = await generateOfficeCheckboxes(areaToOfficeMap, checked)

    expect(checkboxes).toHaveLength(areaToOfficeMap.length)
    const checkbox = checkboxes[0]
    expect(checkbox).toHaveProperty('expanded')
    expect(checkbox.expanded).toEqual(true)
    const $ = cheerio.load(checkbox.content.html)
    const actualCheckboxes = $('div.govuk-checkboxes__item')
    expect(actualCheckboxes).toHaveLength(3)
    const expectedAreaCode = areaToOfficeMap[0].areaCode
    // All area option
    expect($('input', actualCheckboxes[0]).attr('id')).toEqual(`officeLocations_${expectedAreaCode}:*`)
    expect($('input', actualCheckboxes[0]).attr('name')).toEqual('officeCodes')
    expect($('input', actualCheckboxes[0]).attr('value')).toEqual(`${expectedAreaCode}:*`)
    expect($('input', actualCheckboxes[0]).attr('checked')).toEqual('checked')
    expect($('label', actualCheckboxes[0]).attr('for')).toEqual(`officeLocations_${expectedAreaCode}:*`)
    expect($('label', actualCheckboxes[0]).html()).toEqual(`All office locations in the <strong>${areaToOfficeMap[0].areaName}</strong> area`)
    // Individual office locations
    actualCheckboxes.splice(1).forEach((el, j) => {
      const expectedOfficeLocation = areaToOfficeMap[0].officeLocations[j].officeLocation
      const expectedVal = `${expectedAreaCode}:${expectedOfficeLocation}`
      expect($('input', el).attr('id')).toEqual(`officeLocations_${expectedVal}`)
      expect($('input', el).attr('name')).toEqual('officeCodes')
      expect($('input', el).attr('value')).toEqual(expectedVal)
      expect($('input', el).attr('checked')).toBeUndefined()
      expect($('label', el).attr('for')).toEqual(`officeLocations_${expectedAreaCode}:${expectedOfficeLocation}`)
      expect($('label', el).html()).toEqual(expectedOfficeLocation)
    })
  })

  test('when an area is not checked but has offices within identified as checked, only they are returned as checked', async () => {
    const area = areaToOfficeMap[0]
    const checked = [area.officeLocations[0].officeCode]

    const checkboxes = await generateOfficeCheckboxes(areaToOfficeMap, checked)

    expect(checkboxes).toHaveLength(areaToOfficeMap.length)
    const checkbox = checkboxes[0]
    expect(checkbox).toHaveProperty('expanded')
    expect(checkbox.expanded).toEqual(true)
    const $ = cheerio.load(checkbox.content.html)
    const actualCheckboxes = $('div.govuk-checkboxes__item')
    expect(actualCheckboxes).toHaveLength(3)
    expect($('input', actualCheckboxes[0]).attr('checked')).toBeUndefined()
    expect($('input', actualCheckboxes[1]).attr('checked')).toEqual('checked')
    expect($('input', actualCheckboxes[2]).attr('checked')).toBeUndefined()
  })

  test('offices identified as disabled are returned as disabled, area being disabled only disables area', async () => {
    const area = areaToOfficeMap[0]
    const checked = []
    const disabled = [`${area.areaCode}:*`, area.officeLocations[0].officeCode]

    const checkboxes = await generateOfficeCheckboxes(areaToOfficeMap, checked, disabled)

    expect(checkboxes).toHaveLength(areaToOfficeMap.length)
    const checkbox = checkboxes[0]
    expect(checkbox).toHaveProperty('expanded')
    expect(checkbox.expanded).toEqual(false)
    const $ = cheerio.load(checkbox.content.html)
    const actualCheckboxes = $('div.govuk-checkboxes__item')
    expect(actualCheckboxes).toHaveLength(3)
    expect($('input', actualCheckboxes[0]).attr('disabled')).toEqual('disabled')
    expect($('input', actualCheckboxes[1]).attr('disabled')).toEqual('disabled')
    expect($('input', actualCheckboxes[2]).attr('disabled')).toBeUndefined()
  })
})
