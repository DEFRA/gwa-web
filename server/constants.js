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
  officeLocationMappings: {
    unmappedOfficeCode: 'UNM:Unmapped-office-location',
    unmappedOfficeLocation: 'Unmapped office location'
  },
  phoneNumberTypes: {
    corporate: 'corporate',
    personal: 'personal'
  },
  referenceData: {
    areaToOfficeMap: 'areaToOfficeMap',
    organisationList: 'organisationList',
    standardisedOffceLocationMap: 'standardisedOffceLocationMap'
  },
  textMessages: {
    oneMessageCost: 0.016,
    oneMessageLength: 160,
    twoMessageLength: 306,
    additionalMessageIncrement: 153,
    maxMessageLength: 918
  }
}
