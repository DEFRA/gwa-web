const { v4: uuid } = require('uuid')
const { auditEventTypes } = require('../../server/constants')

function generateMessages (num, state) {
  const text = 'some message'
  const createUser = 'creating-things'
  const editUser = 'editing-things'
  const sendUser = 'sending-things'
  const createTime = new Date('2020-12-31T12:34:56')
  const updateTime = new Date('2021-01-02T08:00:00')
  const sendTime = new Date('2021-02-02T08:00:00')
  const baseMessage = {
    id: uuid(),
    auditEvents: [
      { user: { id: createUser }, type: auditEventTypes.create, time: createTime },
      { user: { id: editUser }, type: auditEventTypes.edit, time: updateTime },
      { user: { id: sendUser }, type: auditEventTypes.send, time: sendTime }
    ],
    lastUpdatedAt: new Date('2021-02-03T09:00:00'),
    text
  }

  const messages = []
  for (let i = 0; i < num; i++) {
    messages.push({
      ...baseMessage,
      state
    })
  }
  return messages
}

module.exports = generateMessages
