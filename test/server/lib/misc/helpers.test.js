describe('Misc helpers', () => {
  const { formatDate, getMessageRows } = require('../../../../server/lib/misc/helpers')

  describe('formatDate', () => {
    test('invalid data input should return \'TBC\'', () => {
      const date = formatDate('invalid')

      expect(date).toEqual('TBC')
    })
  })

  describe('getMessageRows', () => {
    test('text over 47 characters is truncated', () => {
      const now = Date.now()
      const message = {
        id: 'msg-id',
        auditEvents: [{
          time: now,
          user: { id: 'id' }
        }],
        lastUpdatedAt: now,
        text: 'a'.repeat(50)
      }

      const row = getMessageRows([message])

      expect(row).toHaveLength(1)
      expect(row[0][0].text).toEqual(formatDate(message.lastUpdatedAt))
      expect(row[0][1].text).toEqual(message.text.slice(0, 47) + ' ...')
    })
  })
})
