describe('Get message rows', () => {
  const { auditEventTypes, messageStates } = require('../constants')
  const addAuditEvent = require('./add-audit-event')
  const getMessageRows = require('./get-message-rows')

  const now = Date.now()
  Date.now = jest.fn()
  Date.now.mockReturnValueOnce(now + 1000).mockReturnValueOnce(now + 2000).mockReturnValueOnce(now + 3000)

  const messageTemplate = {
    info: 'info here',
    officeCodes: ['NOT:real-code', 'UNK:Unknown'],
    text: 'message text goes here'
  }

  test('when message has not been sent, correct rows are returned', () => {
    const user = { id: 'create-user-id', companyName: 'companyName', givenName: 'givenName', surname: 'surname' }
    const message = { ...messageTemplate }
    message.state = messageStates.created
    addAuditEvent(message, user) // use actual function to add audit events for simplicity

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(8)
    messageRows.forEach(row => {
      expect(row).toHaveLength(2)
      expect(row[0]).toHaveProperty('text')
      expect(row[1]).toHaveProperty('text')
    })
    expect(messageRows[0][0].text).toEqual('Message state')
    expect(messageRows[0][1].text).toEqual(message.state)
    expect(messageRows[1][0].text).toEqual('Recipients')
    expect(messageRows[1][1].text).toEqual(message.officeCodes.join(', '))
    expect(messageRows[2][0].text).toEqual('Message text')
    expect(messageRows[2][1].text).toEqual(message.text)
    expect(messageRows[3][0].text).toEqual('Additional information')
    expect(messageRows[3][1].text).toEqual(message.info)
    const createEvent = message.auditEvents.filter(e => e.type === auditEventTypes.create)[0]
    expect(messageRows[4][0].text).toEqual('Created at')
    expect(messageRows[4][1].text).toEqual(new Date(createEvent.time).toLocaleString())
    expect(messageRows[5][0].text).toEqual('Created by')
    expect(messageRows[5][1].text).toEqual(createEvent.user.id)
    const lastEvent = message.auditEvents.sort((e1, e2) => e1.time - e2.time)[0]
    expect(messageRows[6][0].text).toEqual('Last updated at')
    expect(messageRows[6][1].text).toEqual(new Date(lastEvent.time).toLocaleString())
    expect(messageRows[7][0].text).toEqual('Last updated by')
    expect(messageRows[7][1].text).toEqual(lastEvent.user.id)
  })

  test('when message has sent state, correct rows are returned', () => {
    const user = { id: 'create-user-id', companyName: 'companyName', givenName: 'givenName', surname: 'surname' }
    const message = { ...messageTemplate }
    message.state = messageStates.created
    addAuditEvent(message, user) // use actual function to add audit events for simplicity
    message.cost = 4.20
    message.contactCount = 343
    message.state = messageStates.sent
    addAuditEvent(message, user) // use actual function to add audit events for simplicity

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(12)
    messageRows.forEach(row => {
      expect(row).toHaveLength(2)
      expect(row[0]).toHaveProperty('text')
      expect(row[1]).toHaveProperty('text')
    })
    expect(messageRows[0][0].text).toEqual('Message state')
    expect(messageRows[0][1].text).toEqual(message.state)
    expect(messageRows[1][0].text).toEqual('Recipients')
    expect(messageRows[1][1].text).toEqual(message.officeCodes.join(', '))
    expect(messageRows[2][0].text).toEqual('Message text')
    expect(messageRows[2][1].text).toEqual(message.text)
    expect(messageRows[3][0].text).toEqual('Additional information')
    expect(messageRows[3][1].text).toEqual(message.info)
    const createEvent = message.auditEvents.filter(e => e.type === auditEventTypes.create)[0]
    expect(messageRows[4][0].text).toEqual('Created at')
    expect(messageRows[4][1].text).toEqual(new Date(createEvent.time).toLocaleString())
    expect(messageRows[5][0].text).toEqual('Created by')
    expect(messageRows[5][1].text).toEqual(createEvent.user.id)
    const lastEvent = message.auditEvents.sort((e1, e2) => e2.time - e1.time)[0]
    expect(messageRows[6][0].text).toEqual('Last updated at')
    expect(messageRows[6][1].text).toEqual(new Date(lastEvent.time).toLocaleString())
    expect(messageRows[7][0].text).toEqual('Last updated by')
    expect(messageRows[7][1].text).toEqual(lastEvent.user.id)
    const sentEvent = message.auditEvents.filter(e => e.type === auditEventTypes.send)[0]
    expect(messageRows[8][0].text).toEqual('Sent at')
    expect(messageRows[8][1].text).toEqual(new Date(sentEvent.time).toLocaleString())
    expect(messageRows[9][0].text).toEqual('Sent by')
    expect(messageRows[9][1].text).toEqual(sentEvent.user.id)
    expect(messageRows[10][0].text).toEqual('Approx cost')
    expect(messageRows[10][1].text).toEqual(`£${message.cost}`)
    expect(messageRows[11][0].text).toEqual('Approx message sent count')
    expect(messageRows[11][1].text).toEqual(message.contactCount)
  })
})
