describe('Generate organisation checkboxes', () => {
  const generateOrganisationCheckboxes = require('../../../server/lib/organisation-checkboxes')

  const orgList = [{
    active: true,
    orgCode: 'orgCode1',
    orgName: 'orgName1'
  }, {
    active: true,
    orgCode: 'orgCode2',
    orgName: 'orgName2'
  }, {
    active: true,
    orgCode: 'orgCode3',
    orgName: 'orgName3'
  }, {
    active: false,
    orgCode: 'orgCode4',
    orgName: 'orgName4'
  }]

  test('all active organisations in the list are returned', async () => {
    const checkboxes = await generateOrganisationCheckboxes(orgList)

    expect(checkboxes).toHaveLength(3)
    checkboxes.forEach((cb, i) => {
      expect(cb).toHaveProperty('text')
      expect(cb.text).toEqual(orgList[i].orgName)
      expect(cb).toHaveProperty('value')
      expect(cb.value).toEqual(orgList[i].orgCode)
      expect(cb).toHaveProperty('checked')
      expect(cb.checked).toBe(false)
    })
  })

  test('organisations identified as checked as marked as such', async () => {
    const checked = [orgList[2].orgCode]
    const checkboxes = await generateOrganisationCheckboxes(orgList, checked)

    expect(checkboxes).toHaveLength(3)
    expect(checkboxes[0]).toHaveProperty('text')
    expect(checkboxes[0].text).toEqual(orgList[0].orgName)
    expect(checkboxes[0]).toHaveProperty('value')
    expect(checkboxes[0].value).toEqual(orgList[0].orgCode)
    expect(checkboxes[0]).toHaveProperty('checked')
    expect(checkboxes[0].checked).toBe(false)
    expect(checkboxes[1]).toHaveProperty('text')
    expect(checkboxes[1].text).toEqual(orgList[1].orgName)
    expect(checkboxes[1]).toHaveProperty('value')
    expect(checkboxes[1].value).toEqual(orgList[1].orgCode)
    expect(checkboxes[1]).toHaveProperty('checked')
    expect(checkboxes[1].checked).toBe(false)
    expect(checkboxes[2]).toHaveProperty('text')
    expect(checkboxes[2].text).toEqual(orgList[2].orgName)
    expect(checkboxes[2]).toHaveProperty('value')
    expect(checkboxes[2].value).toEqual(orgList[2].orgCode)
    expect(checkboxes[2]).toHaveProperty('checked')
    expect(checkboxes[2].checked).toBe(true)
  })
})
