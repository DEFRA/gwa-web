const cheerio = require('cheerio')

const areaCode1 = 'AC1'
const areaCode2 = 'AC2'

describe('Generate office checkboxes', () => {
  const areaToOfficeMap = [{
    areaCode: areaCode1,
    areaName: 'areaName1',
    officeLocations: [{
      officeCode: `${areaCode1}:office1`,
      officeLocation: 'area1 office1'
    }, {
      officeCode: `${areaCode1}:office2`,
      officeLocation: 'area1 office2'
    }]
  }, {
    areaCode: areaCode2,
    areaName: 'areaName2',
    officeLocations: [{
      officeCode: `${areaCode2}:office1`,
      officeLocation: 'area2 office1'
    }, {
      officeCode: `${areaCode2}:office2`,
      officeLocation: 'area2 office2'
    }]
  }]

  let generateOfficeCheckboxes

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    generateOfficeCheckboxes = require('../../../server/lib/office-checkboxes')
  })

  test('all offices within an area are returned as list items for several areas and the area level is a checkbox option', async () => {
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
      expect(actualCheckboxes).toHaveLength(1)
      // All area option
      expect($('input', actualCheckboxes[0]).attr('id')).toEqual(`officeLocations_${areaToOfficeMapData.areaCode}:*`)
      expect($('input', actualCheckboxes[0]).attr('name')).toEqual('officeCodes')
      expect($('input', actualCheckboxes[0]).attr('value')).toEqual(`${areaToOfficeMapData.areaCode}:*`)
      expect($('label', actualCheckboxes[0]).attr('for')).toEqual(`officeLocations_${areaToOfficeMapData.areaCode}:*`)
      expect($('label', actualCheckboxes[0]).html()).toEqual(`All office locations in the <strong>${areaToOfficeMapData.areaName}</strong> area`)

      const actualListItems = $('ul.govuk-list li')
      expect(actualListItems).toHaveLength(2)
      expect($(actualListItems[0]).text()).toEqual(areaToOfficeMap[i].officeLocations[0].officeLocation)
      expect($(actualListItems[1]).text()).toEqual(areaToOfficeMap[i].officeLocations[1].officeLocation)
    })
  })

  test('when an area is identified as checked, the area is checked and it is expanded', async () => {
    const checked = [`${areaCode1}:*`]

    const checkboxes = await generateOfficeCheckboxes(areaToOfficeMap, checked)

    expect(checkboxes).toHaveLength(areaToOfficeMap.length)
    const checkbox = checkboxes[0]
    expect(checkbox).toHaveProperty('expanded')
    expect(checkbox.expanded).toEqual(true)
    const $ = cheerio.load(checkbox.content.html)
    const actualCheckboxes = $('div.govuk-checkboxes__item')
    expect(actualCheckboxes).toHaveLength(1)
    const expectedAreaCode = areaToOfficeMap[0].areaCode
    // All area option
    expect($('input', actualCheckboxes[0]).attr('id')).toEqual(`officeLocations_${expectedAreaCode}:*`)
    expect($('input', actualCheckboxes[0]).attr('name')).toEqual('officeCodes')
    expect($('input', actualCheckboxes[0]).attr('value')).toEqual(`${expectedAreaCode}:*`)
    expect($('input', actualCheckboxes[0]).attr('checked')).toEqual('checked')
    expect($('label', actualCheckboxes[0]).attr('for')).toEqual(`officeLocations_${expectedAreaCode}:*`)
    expect($('label', actualCheckboxes[0]).html()).toEqual(`All office locations in the <strong>${areaToOfficeMap[0].areaName}</strong> area`)
    // Individual office locations
    const actualListItems = $('ul.govuk-list li')
    expect(actualListItems).toHaveLength(2)
    expect($(actualListItems[0]).text()).toEqual(areaToOfficeMap[0].officeLocations[0].officeLocation)
    expect($(actualListItems[1]).text()).toEqual(areaToOfficeMap[0].officeLocations[1].officeLocation)
  })

  test('areas identified as disabled are returned as disabled', async () => {
    const area = areaToOfficeMap[0]
    const checked = []
    const disabled = [`${area.areaCode}:*`]

    const checkboxes = await generateOfficeCheckboxes(areaToOfficeMap, checked, disabled)

    expect(checkboxes).toHaveLength(areaToOfficeMap.length)
    const checkbox = checkboxes[0]
    expect(checkbox).toHaveProperty('expanded')
    expect(checkbox.expanded).toEqual(false)
    const $ = cheerio.load(checkbox.content.html)
    const actualCheckboxes = $('div.govuk-checkboxes__item')
    expect(actualCheckboxes).toHaveLength(1)
    expect($('input', actualCheckboxes[0]).attr('disabled')).toEqual('disabled')
    const actualListItems = $('ul.govuk-list li')
    expect(actualListItems).toHaveLength(2)
    expect($(actualListItems[0]).text()).toEqual(areaToOfficeMap[0].officeLocations[0].officeLocation)
    expect($(actualListItems[1]).text()).toEqual(areaToOfficeMap[0].officeLocations[1].officeLocation)
  })
})
