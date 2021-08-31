const { errorMessages, textMessages: { maxInfoLength, maxMessageLength } } = require('../../server/constants')

module.exports = {
  errorCases: [
    [{ officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, errorMessages.allOffices],
    [{ officeCodes: 'ABC:one', orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, errorMessages.allOffices],
    [{ allOffices: true, orgCodes: '', text: 'message to send', info: 'valid' }, errorMessages.orgCodes],
    [{ allOffices: true, orgCodes: ['orgCode'], text: 'message to send', info: 'a'.repeat(maxInfoLength + 1) }, errorMessages.info],
    [{ allOffices: true, orgCodes: ['orgCode'], text: 'a'.repeat(maxMessageLength + 1) }, errorMessages.text],
    [{ allOffices: false, officeCodes: [], orgCodes: ['orgCode', 'another'], text: 'message to send', info: 'valid' }, errorMessages.officeCodes],
    [{ allOffices: false, officeCodes: [], orgCodes: 'orgCode', text: 'message to send', info: 'valid' }, errorMessages.officeCodes],
    [{ allOffices: false, officeCodes: ['ABC:one'], orgCodes: [], text: 'message to send', info: 'valid' }, errorMessages.orgCodes]
  ],
  validCases: [
    [{ allOffices: false, officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }],
    [{ allOffices: false, officeCodes: 'ABC:one', orgCodes: 'orgCode', text: 'message to send', info: 'valid' }],
    [{ allOffices: true, orgCodes: ['orgCode', 'another'], text: 'message to send' }],
    [{ allOffices: true, orgCodes: ['orgCode'], text: 'a'.repeat(maxMessageLength), info: 'a'.repeat(maxInfoLength) }],
    [{ allOffices: true, orgCodes: ['orgCode'], text: 'message to send', info: ` ${'a'.repeat(maxInfoLength)} ` }],
    [{ allOffices: true, orgCodes: ['orgCode', 'another'], text: '     padded with spaces     ', info: '     padded with spaces     ' }]
  ]
}
