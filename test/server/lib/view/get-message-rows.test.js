describe('Get message rows', () => {
  const { auditEventTypes, messageStates } = require('../../../../server/constants')
  const addAuditEvent = require('../../../../server/lib/messages/add-audit-event')
  const getMessageRows = require('../../../../server/lib/view/get-message-rows')
  const user = { id: 'create-user-id', companyName: 'companyName', givenName: 'givenName', surname: 'surname' }

  const now = Date.now()
  Date.now = jest.fn()
  Date.now.mockReturnValueOnce(now + 1000).mockReturnValueOnce(now + 2000).mockReturnValueOnce(now + 3000)

  const messageTemplate = {
    allOffices: false,
    info: 'info here',
    officeCodes: ['NOT:real-code', 'UNK:Unknown'],
    orgCodes: ['ORG1', 'ORG2'],
    state: messageStates.created,
    text: 'message text goes here'
  }

  function expectRowProperties (rows) {
    rows.forEach(row => {
      expect(row).toHaveLength(2)
      expect(row[0]).toHaveProperty('text')
      expect(row[1]).toHaveProperty('text')
    })
  }

  function expectStandardRows (rows, message) {
    expect(rows[0][0].text).toEqual('Message state')
    expect(rows[0][1].text).toEqual(message.state)
    expect(rows[1][0].text).toEqual('Office location recipients')
    expect(rows[1][1].text).toEqual(message.officeCodes.join(', '))
    expect(rows[2][0].text).toEqual('Organisation recipients')
    expect(rows[2][1].text).toEqual(message.orgCodes.join(', '))
    expect(rows[3][0].text).toEqual('Message text')
    expect(rows[3][1].text).toEqual(message.text)
    expect(rows[4][0].text).toEqual('Additional information')
    expect(rows[4][1].text).toEqual(message.info)
    const createEvent = message.auditEvents.filter(e => e.type === auditEventTypes.create)[0]
    expect(rows[5][0].text).toEqual('Created at')
    expect(rows[5][1].text).toEqual(new Date(createEvent.time).toLocaleString())
    expect(rows[6][0].text).toEqual('Created by')
    expect(rows[6][1].text).toEqual(createEvent.user.id)
    const lastEvent = message.auditEvents.sort((e1, e2) => e1.time - e2.time)[0]
    expect(rows[7][0].text).toEqual('Last updated at')
    expect(rows[7][1].text).toEqual(new Date(lastEvent.time).toLocaleString())
    expect(rows[8][0].text).toEqual('Last updated by')
    expect(rows[8][1].text).toEqual(lastEvent.user.id)
  }

  test('when message has not been sent, correct rows are returned', () => {
    const message = { ...messageTemplate }
    addAuditEvent(message, user) // use the actual function to add audit events for simplicity

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(9)
    expectRowProperties(messageRows)
    expectStandardRows(messageRows, message)
  })

  test('when message is sent to all offices, display is correct', () => {
    const message = { ...messageTemplate }
    message.allOffices = true
    addAuditEvent(message, user) // use the actual function to add audit events for simplicity

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(9)
    expectRowProperties(messageRows)
    expect(messageRows[1][0].text).toEqual('Office location recipients')
    expect(messageRows[1][1].text).toEqual('All offices')
  })

  test.each([
    { cost: 4.2, rounded: '4.20' },
    { cost: 4.204, rounded: '4.20' },
    { cost: 4.205, rounded: '4.21' }
  ])('when message has sent state, correct rows are returned', ({ cost, rounded }) => {
    const message = { ...messageTemplate }
    message.state = messageStates.created
    addAuditEvent(message, user) // use actual function to add audit events for simplicity
    message.cost = cost
    message.contactCount = 343
    message.state = messageStates.sent
    addAuditEvent(message, user) // use actual function to add audit events for simplicity

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(13)
    expectRowProperties(messageRows)
    expectStandardRows(messageRows, message)
    const sentEvent = message.auditEvents.filter(e => e.type === auditEventTypes.send)[0]
    expect(messageRows[9][0].text).toEqual('Sent at')
    expect(messageRows[9][1].text).toEqual(new Date(sentEvent.time).toLocaleString())
    expect(messageRows[10][0].text).toEqual('Sent by')
    expect(messageRows[10][1].text).toEqual(sentEvent.user.id)
    expect(messageRows[11][0].text).toEqual('Approx cost')
    expect(messageRows[11][1].text).toEqual(`£${rounded}`)
    expect(messageRows[12][0].text).toEqual('Approx message sent count')
    expect(messageRows[12][1].text).toEqual(message.contactCount)
  })
})
