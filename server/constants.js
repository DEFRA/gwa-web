const notifyServiceName = 'Group Wide Alerts - Defra'
const notifyServiceNameLength = notifyServiceName.length

module.exports = {
  auditEventTypes: {
    create: 'create',
    edit: 'edit',
    send: 'send'
  },
  contacts: {
    maxPersonalPhoneNumbers: 1
  },
  errorMessages: {
    allOffices: 'Select whether to send the message to all office locations',
    officeCodes: 'Select at least one office location',
    orgCodes: 'Select at least one organisation',
    text: 'Enter the message text',
    info: 'Enter the additional information'
  },
  messages: {
    sentMessagePageSize: 25
  },
  messageStates: {
    created: 'created',
    edited: 'edited',
    sent: 'sent'
  },
  navigation: {
    header: {
      account: {
        text: 'Account',
        href: '/account'
      },
      messages: {
        text: 'Messages',
        href: '/messages'
      },
      data: {
        text: 'Manage Data',
        href: '/data-manage'
      },
      signIn: {
        text: 'Sign in',
        href: '/login'
      },
      signOut: {
        text: 'Sign out',
        href: '/logout'
      }
    }
  },
  officeLocationMappings: {
    unmappedOfficeCode: 'UNM:Unmapped-office-location',
    unmappedOfficeLocation: 'Unmapped office location'
  },
  orgDataFileHeaders: ['emailAddress', 'givenName', 'surname', 'officeLocation', 'phoneNumber'],
  phoneNumberTypes: {
    corporate: 'corporate',
    personal: 'personal'
  },
  referenceData: {
    areaToOfficeMap: 'areaToOfficeMap',
    organisationList: 'organisationList',
    organisationMap: 'organisationMap',
    standardisedOfficeLocationMap: 'standardisedOfficeLocationMap'
  },
  textMessages: {
    // Notify can prepend the message with the name of the service, an option
    // that has been turned on as it helps people to identify the sms sender.
    // Standard char allowances need to be reduced accordingly.
    oneMessageCost: 0.016,
    oneMessageLength: 160 - notifyServiceNameLength,
    twoMessageLength: 306 - notifyServiceNameLength,
    additionalMessageIncrement: 153,
    maxMessageLength: 918 - notifyServiceNameLength,
    maxInfoLength: 2000
  }
}
