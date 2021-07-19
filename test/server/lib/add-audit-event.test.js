describe('Add audit events', () => {
  const addAuditEvent = require('../../../server/lib/messages/add-audit-event')
  const { auditEventTypes, messageStates } = require('../../../server/constants')

  const now = Date.now()
  Date.now = jest.fn(() => now)

  test.each([
    [messageStates.created, auditEventTypes.create],
    [messageStates.edited, auditEventTypes.edit],
    [messageStates.sent, auditEventTypes.send]
  ])('when message has state "%s", an audit event of type "%s" is added to the message', (state, type) => {
    const message = { state }
    const user = { id: 'id', companyName: 'companyName', givenName: 'givenName', surname: 'surname' }

    addAuditEvent(message, user)

    expect(message).toHaveProperty('auditEvents')
    expect(message.auditEvents).toEqual([{
      type,
      time: now,
      user: {
        id: user.id,
        surname: user.surname,
        givenName: user.givenName,
        companyName: user.companyName
      }
    }])
  })

  test('when audit events already exist additional ones are added', () => {
    const message = { auditEvents: [{}], state: messageStates.sent }
    const user = { id: 'id', companyName: 'companyName', givenName: 'givenName', surname: 'surname' }

    addAuditEvent(message, user)

    expect(message).toHaveProperty('auditEvents')
    expect(message.auditEvents).toHaveLength(2)
    expect(message.auditEvents[1]).toEqual({
      type: auditEventTypes.send,
      time: now,
      user: {
        id: user.id,
        surname: user.surname,
        givenName: user.givenName,
        companyName: user.companyName
      }
    })
  })

  test('error is thrown when message contains an unknown state', () => {
    const message = { state: 'unknown' }

    expect(() => addAuditEvent(message)).toThrowError(Error)
    expect(() => addAuditEvent(message)).toThrow(`Message state '${message.state}' does not have a matching audit event type.`)
  })
})
