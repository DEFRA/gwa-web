describe('Generate organisation checkboxes', () => {
  const generateOrganisationCheckboxes = require('./organisation-checkboxes')
  const orgList = [{
    orgCode: 'orgCode1',
    orgDescription: 'orgDescription1'
  }, {
    orgCode: 'orgCode2',
    orgDescription: 'orgDescription2'
  }, {
    orgCode: 'orgCode3',
    orgDescription: 'orgDescription3'
  }]

  test('all organisations in the list are returned', () => {
    const checkboxes = generateOrganisationCheckboxes(orgList)

    expect(checkboxes).toHaveLength(3)
    checkboxes.forEach((cb, i) => {
      expect(cb).toHaveProperty('text')
      expect(cb.text).toEqual(orgList[i].orgDescription)
      expect(cb).toHaveProperty('value')
      expect(cb.value).toEqual(orgList[i].orgCode)
      expect(cb).toHaveProperty('checked')
      expect(cb.checked).toBe(false)
    })
  })

  test('organisations identified as checked as marked as such', () => {
    const checked = [orgList[2].orgCode]
    const checkboxes = generateOrganisationCheckboxes(orgList, checked)

    expect(checkboxes).toHaveLength(3)
    expect(checkboxes[0]).toHaveProperty('text')
    expect(checkboxes[0].text).toEqual(orgList[0].orgDescription)
    expect(checkboxes[0]).toHaveProperty('value')
    expect(checkboxes[0].value).toEqual(orgList[0].orgCode)
    expect(checkboxes[0]).toHaveProperty('checked')
    expect(checkboxes[0].checked).toBe(false)
    expect(checkboxes[1]).toHaveProperty('text')
    expect(checkboxes[1].text).toEqual(orgList[1].orgDescription)
    expect(checkboxes[1]).toHaveProperty('value')
    expect(checkboxes[1].value).toEqual(orgList[1].orgCode)
    expect(checkboxes[1]).toHaveProperty('checked')
    expect(checkboxes[1].checked).toBe(false)
    expect(checkboxes[2]).toHaveProperty('text')
    expect(checkboxes[2].text).toEqual(orgList[2].orgDescription)
    expect(checkboxes[2]).toHaveProperty('value')
    expect(checkboxes[2].value).toEqual(orgList[2].orgCode)
    expect(checkboxes[2]).toHaveProperty('checked')
    expect(checkboxes[2].checked).toBe(true)
  })
})
