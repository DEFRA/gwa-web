describe('Get message rows', () => {
  const { auditEventTypes, messageStates } = require('../../../../server/constants')
  // use the actual function to add audit events to message
  const addAuditEvent = require('../../../../server/lib/messages/add-audit-event')
  const { formatDate } = require('../../../../server/lib/misc/helpers')
  const getMessageRows = require('../../../../server/lib/view/get-message-rows')
  const user = { id: 'create-user-id', companyName: 'companyName', givenName: 'givenName', surname: 'surname' }

  const now = Date.now()
  Date.now = jest.fn().mockReturnValue(now + 1000).mockReturnValueOnce(now + 2000).mockReturnValueOnce(now + 3000)

  const messageTemplate = {
    allOffices: false,
    allOrgs: false,
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
    expect(rows[0][1].text).toEqual(message.state.toUpperCase())
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
    expect(rows[5][1].text).toEqual(formatDate(createEvent.time))
    expect(rows[6][0].text).toEqual('Created by')
    expect(rows[6][1].text).toEqual(createEvent.user.id)
    const lastEvent = message.auditEvents.sort((e1, e2) => e1.time - e2.time)[0]
    expect(rows[7][0].text).toEqual('Last updated at')
    expect(rows[7][1].text).toEqual(formatDate(lastEvent.time))
    expect(rows[8][0].text).toEqual('Last updated by')
    expect(rows[8][1].text).toEqual(lastEvent.user.id)
  }

  test('when message has not been sent, correct rows are returned', () => {
    const message = { ...messageTemplate }
    addAuditEvent(message, user)

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(9)
    expectRowProperties(messageRows)
    expectStandardRows(messageRows, message)
  })

  test('when message is sent to all offices, display is correct', () => {
    const message = { ...messageTemplate }
    message.allOffices = true
    addAuditEvent(message, user)

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(9)
    expectRowProperties(messageRows)
    expect(messageRows[1][0].text).toEqual('Office location recipients')
    expect(messageRows[1][1].text).toEqual('All offices')
  })

  test('when message is sent to all organisations, display is correct', () => {
    const message = { ...messageTemplate }
    message.allOrgs = true
    addAuditEvent(message, user)

    const messageRows = getMessageRows(message)

    expect(messageRows).toHaveLength(9)
    expectRowProperties(messageRows)
    expect(messageRows[2][0].text).toEqual('Organisation recipients')
    expect(messageRows[2][1].text).toEqual('All organisations')
  })

  test.each([
    { cost: 4.2, rounded: '4.20' },
    { cost: 4.204, rounded: '4.20' },
    { cost: 4.205, rounded: '4.21' }
  ])('when message has sent state, correct rows are returned', ({ cost, rounded }) => {
    const message = { ...messageTemplate }
    message.state = messageStates.created
    addAuditEvent(message, user)
    message.cost = cost
    message.contactCount = 343
    message.state = messageStates.sent
    addAuditEvent(message, user)
    const sentStats = {
      failedToSend: 1,
      notifyDelivered: 2,
      notifyFailed: 3,
      pendingSending: 4,
      rateLimited: 5,
      timeOfFirstSend: now,
      timeOfLastSend: now,
      toBeRetried: 0
    }

    const messageRows = getMessageRows(message, sentStats)

    expect(messageRows).toHaveLength(21)
    expectRowProperties(messageRows)
    expectStandardRows(messageRows, message)
    const sentEvent = message.auditEvents.filter(e => e.type === auditEventTypes.send)[0]
    expect(messageRows[9][0].text).toEqual('Sent at')
    expect(messageRows[9][1].text).toEqual(formatDate(sentEvent.time))
    expect(messageRows[10][0].text).toEqual('Sent by')
    expect(messageRows[10][1].text).toEqual(sentEvent.user.id)
    expect(messageRows[11][0].text).toEqual('Approx cost')
    expect(messageRows[11][1].text).toEqual(`£${rounded}`)
    expect(messageRows[12][0].text).toEqual('Messages to send')
    expect(messageRows[12][1].text).toEqual(message.contactCount)
    expect(messageRows[13][0].text).toEqual('Messages waiting to be sent by Notify')
    expect(messageRows[13][1].text).toEqual(sentStats.pendingSending)
    expect(messageRows[14][0].text).toEqual('Messages failed to send to Notify')
    expect(messageRows[14][1].text).toEqual(sentStats.failedToSend)
    expect(messageRows[15][0].text).toEqual('Messages rate limited')
    expect(messageRows[15][1].text).toEqual(sentStats.rateLimited)
    expect(messageRows[16][0].text).toEqual('Messages retried')
    expect(messageRows[16][1].text).toEqual(sentStats.toBeRetried)
    expect(messageRows[17][0].text).toEqual('Messages delivered by Notify')
    expect(messageRows[17][1].text).toEqual(sentStats.notifyDelivered)
    expect(messageRows[18][0].text).toEqual('Messages failed by Notify')
    expect(messageRows[18][1].text).toEqual(sentStats.notifyFailed)
    expect(messageRows[19][0].text).toEqual('First message sent at')
    expect(messageRows[19][1].text).toEqual(formatDate(sentStats.timeOfFirstSend))
    expect(messageRows[20][0].text).toEqual('Last message sent at')
    expect(messageRows[20][1].text).toEqual(formatDate(sentStats.timeOfLastSend))
  })
})
