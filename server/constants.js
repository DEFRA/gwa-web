module.exports = {
  auditEventTypes: {
    create: 'create',
    edit: 'edit',
    send: 'send'
  },
  messageStates: {
    created: 'created',
    edited: 'edited',
    sent: 'sent'
  },
  phoneNumberTypes: {
    corporate: 'corporate',
    personal: 'personal'
  },
  textMessages: {
    oneMessageCost: 0.016,
    oneMessageLength: 160,
    twoMessageLength: 306,
    additionalMessageIncrement: 153,
    maxMessageLength: 918
  }
}
