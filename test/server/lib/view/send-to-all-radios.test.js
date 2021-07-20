describe('send to all orgs radio creation', () => {
  const generateSendToAllOrgsRadios = require('../../../../server/lib/view/send-to-all-radios')

  test('radios are generated correctly when no selected value is supplied', () => {
    const radioItems = generateSendToAllOrgsRadios()

    expect(radioItems).toHaveLength(2)
    expect(radioItems[0].checked).toBe(undefined)
    expect(radioItems[0].value).toBe(true)
    expect(radioItems[0].text).toBe('Yes')
    expect(radioItems[1].checked).toBe(undefined)
    expect(radioItems[1].value).toBe(false)
    expect(radioItems[1].text).toBe('No')
  })

  test.each([
    [true],
    [false]
  ])('radios are generated correctly when boolean selected value is supplied - %s', (val) => {
    const radioItems = generateSendToAllOrgsRadios(val)

    expect(radioItems).toHaveLength(2)
    expect(radioItems[0].checked).toBe(val ? true : undefined)
    expect(radioItems[0].value).toBe(true)
    expect(radioItems[0].text).toBe('Yes')
    expect(radioItems[1].checked).toBe(!val ? true : undefined)
    expect(radioItems[1].value).toBe(false)
    expect(radioItems[1].text).toBe('No')
  })

  test.each([
    ['true'],
    ['false']
  ])('radios are generated correctly when string selected value is supplied - "%s"', (val) => {
    const radioItems = generateSendToAllOrgsRadios(val)

    expect(radioItems).toHaveLength(2)
    expect(radioItems[0].checked).toBe(val === 'true' ? true : undefined)
    expect(radioItems[0].value).toBe(true)
    expect(radioItems[0].text).toBe('Yes')
    expect(radioItems[1].checked).toBe(val === 'false' ? true : undefined)
    expect(radioItems[1].value).toBe(false)
    expect(radioItems[1].text).toBe('No')
  })
})
