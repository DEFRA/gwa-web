describe('Generate non core org select items', () => {
  const generateOrganisationCheckboxes = require('../../../server/lib/non-core-org-select')

  const organisations = [{
    active: true,
    core: false,
    orgCode: 'orgCode1',
    orgName: 'orgName1'
  }, {
    active: true,
    core: false,
    orgCode: 'orgCode2',
    orgName: 'orgName2'
  }, {
    active: true,
    core: true,
    orgCode: 'orgCode3',
    orgName: 'orgName3'
  }, {
    active: false,
    core: false,
    orgCode: 'orgCode4',
    orgName: 'orgName4'
  }]

  test('all organisations that are active and not core are returned along with the default option', async () => {
    const selectItems = await generateOrganisationCheckboxes(organisations)

    expect(selectItems).toHaveLength(3)

    expect(selectItems[0]).toHaveProperty('text')
    expect(selectItems[0].text).toEqual('Select an organisation')
    expect(selectItems[0]).not.toHaveProperty('value')
    expect(selectItems[0]).toHaveProperty('selected')
    expect(selectItems[0].selected).toBe(true)

    selectItems.slice(1, 3).forEach((si, i) => {
      expect(si).toHaveProperty('text')
      expect(si.text).toEqual(organisations[i].orgName)
      expect(si).toHaveProperty('value')
      expect(si.value).toEqual(organisations[i].orgCode)
      expect(si).toHaveProperty('selected')
      expect(si.selected).toBe(false)
    })
  })

  test('organisations identified as selected as marked as such', async () => {
    const selected = organisations[1].orgCode
    const selectItems = await generateOrganisationCheckboxes(organisations, selected)

    expect(selectItems).toHaveLength(3)

    expect(selectItems[0]).toHaveProperty('text')
    expect(selectItems[0].text).toEqual('Select an organisation')
    expect(selectItems[0]).not.toHaveProperty('value')
    expect(selectItems[0]).toHaveProperty('selected')
    expect(selectItems[0].selected).toBe(false)

    expect(selectItems[1]).toHaveProperty('text')
    expect(selectItems[1].text).toEqual(organisations[0].orgName)
    expect(selectItems[1]).toHaveProperty('value')
    expect(selectItems[1].value).toEqual(organisations[0].orgCode)
    expect(selectItems[1]).toHaveProperty('selected')
    expect(selectItems[1].selected).toBe(false)

    expect(selectItems[2]).toHaveProperty('text')
    expect(selectItems[2].text).toEqual(organisations[1].orgName)
    expect(selectItems[2]).toHaveProperty('value')
    expect(selectItems[2].value).toEqual(organisations[1].orgCode)
    expect(selectItems[2]).toHaveProperty('selected')
    expect(selectItems[2].selected).toBe(true)
  })
})
