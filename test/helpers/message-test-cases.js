const { errorMessages, textMessages: { maxInfoLength, maxMessageLength } } = require('../../server/constants')

module.exports = {
  errorCases: [
    [{ allOrgs: false, officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, errorMessages.allOffices],
    [{ allOrgs: false, officeCodes: 'ABC:one', orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, errorMessages.allOffices],
    [{ allOffices: true, orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }, errorMessages.allOrgs],
    [{ allOffices: true, orgCodes: 'orgCode', text: 'message to send', info: 'valid' }, errorMessages.allOrgs],
    [{ allOffices: true, allOrgs: false, orgCodes: '', text: 'message to send', info: 'valid' }, errorMessages.orgCodes],
    [{ allOffices: true, allOrgs: false, orgCodes: ['orgCode'], text: 'message to send', info: 'a'.repeat(maxInfoLength + 1) }, errorMessages.info],
    [{ allOffices: true, allOrgs: false, orgCodes: ['orgCode'], text: 'a'.repeat(maxMessageLength + 1) }, errorMessages.text],
    [{ allOffices: false, allOrgs: false, officeCodes: [], orgCodes: ['orgCode', 'another'], text: 'message to send', info: 'valid' }, errorMessages.officeCodes],
    [{ allOffices: false, allOrgs: false, officeCodes: [], orgCodes: 'orgCode', text: 'message to send', info: 'valid' }, errorMessages.officeCodes],
    [{ allOffices: false, allOrgs: false, officeCodes: ['ABC:one'], orgCodes: [], text: 'message to send', info: 'valid' }, errorMessages.orgCodes]
  ],
  validCases: [
    [{ allOffices: false, allOrgs: false, officeCodes: ['ABC:one', 'XYZ:two'], orgCodes: ['orgCode'], text: 'message to send', info: 'valid' }],
    [{ allOffices: false, allOrgs: true, officeCodes: 'ABC:one', orgCodes: 'orgCode', text: 'message to send', info: 'valid' }],
    [{ allOffices: true, allOrgs: false, orgCodes: ['orgCode', 'another'], text: 'message to send' }],
    [{ allOffices: true, allOrgs: true, text: 'a'.repeat(maxMessageLength), info: 'a'.repeat(maxInfoLength) }],
    [{ allOffices: true, allOrgs: false, orgCodes: ['orgCode'], text: 'message to send', info: ` ${'a'.repeat(maxInfoLength)} ` }],
    [{ allOffices: true, allOrgs: true, orgCodes: ['orgCode', 'another'], text: '     padded with spaces     ', info: '     padded with spaces     ' }]
  ]
}
