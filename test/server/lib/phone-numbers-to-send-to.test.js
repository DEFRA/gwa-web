const getPhoneNumbersToSendTo = require('../../../server/lib/phone-numbers-to-send-to')

describe('Get phone numbers to send to', () => {
  test('only user\'s phone numbers with an individual office subscribedTo to the selected office are returned when the all office in an area is selected to send the message to', () => {
    const users = [{
      active: true,
      orgCode: 'ABC',
      phoneNumbers: [{
        number: '07777111111',
        subscribedTo: ['ANY:anything']
      }, {
        number: '07777222222',
        subscribedTo: ['OFC:a-specific-office']
      }]
    }, {
      active: true,
      orgCode: 'XYZ',
      phoneNumbers: [{
        number: '07888111111',
        subscribedTo: ['ANY:anything']
      }]
    }]
    const message = {
      allOffices: false,
      officeCodes: ['OFC:*', 'ANY:not-the-same'],
      orgCodes: ['ABC', 'XYZ']
    }

    const phoneNumbers = getPhoneNumbersToSendTo(users, message)

    expect(phoneNumbers).toHaveLength(1)
    expect(phoneNumbers[0]).toEqual(users[0].phoneNumbers[1].number)
  })

  test('only user\'s phone numbers with an all offices in the area option subscribedTo to the selected office are returned when a single office in an area is selected to send the message to', () => {
    const users = [{
      active: true,
      orgCode: 'ABC',
      phoneNumbers: [{
        number: '07777111111',
        subscribedTo: ['ANY:anything']
      }, {
        number: '07777222222',
        subscribedTo: ['OFC:*']
      }]
    }, {
      active: true,
      orgCode: 'XYZ',
      phoneNumbers: [{
        number: '07888111111',
        subscribedTo: ['OFC:not-a-match']
      }]
    }]
    const message = {
      allOffices: false,
      officeCodes: ['OFC:specific-office'],
      orgCodes: ['ABC', 'XYZ']
    }

    const phoneNumbers = getPhoneNumbersToSendTo(users, message)

    expect(phoneNumbers).toHaveLength(1)
    expect(phoneNumbers[0]).toEqual(users[0].phoneNumbers[1].number)
  })

  test('only user\'s phone numbers with an all offices in the area option subscribedTo to the selected office are returned when the all office in an area is selected to send the message to', () => {
    const users = [{
      active: true,
      orgCode: 'ABC',
      phoneNumbers: [{
        number: '07777111111',
        subscribedTo: ['ANY:anything']
      }, {
        number: '07777222222',
        subscribedTo: ['OFC:*']
      }]
    }, {
      active: true,
      orgCode: 'XYZ',
      phoneNumbers: [{
        number: '07888111111',
        subscribedTo: ['OFC:not-a-match']
      }]
    }]
    const message = {
      allOffices: false,
      officeCodes: ['OFC:*'],
      orgCodes: ['ABC']
    }

    const phoneNumbers = getPhoneNumbersToSendTo(users, message)

    expect(phoneNumbers).toHaveLength(1)
    expect(phoneNumbers[0]).toEqual(users[0].phoneNumbers[1].number)
  })

  test('users phone numbers matching the message critera are not returned if the org they are in is not included in the message crtieria', () => {
    const users = [{
      active: true,
      orgCode: 'ABC',
      phoneNumbers: [{
        number: '07777111111',
        subscribedTo: ['ANY:anything']
      }, {
        number: '07777222222',
        subscribedTo: ['OFC:specific-office']
      }]
    }, {
      active: true,
      orgCode: 'XYZ',
      phoneNumbers: [{
        number: '07888111111',
        subscribedTo: ['ANY:anything']
      }]
    }]
    const message = {
      allOffices: true,
      officeCodes: ['IGN:this-is-not-used'],
      orgCodes: ['XYZ']
    }

    const phoneNumbers = getPhoneNumbersToSendTo(users, message)

    expect(phoneNumbers).toHaveLength(1)
    expect(phoneNumbers[0]).toEqual(users[1].phoneNumbers[0].number)
  })

  test('only users matching the organisation selected and with phone numbers subscribedTo an office have their phone numbers returned', () => {
    const users = [{
      active: true,
      orgCode: 'ABC',
      phoneNumbers: [{
        number: '07777111111',
        subscribedTo: ['ANY:anything']
      }, {
        number: '07777222222',
        subscribedTo: []
      }]
    }, {
      active: true,
      orgCode: 'XYZ',
      phoneNumbers: [{
        number: '07888111111',
        subscribedTo: ['ANY:anything']
      }]
    }]
    const message = {
      allOffices: true,
      officeCodes: [],
      orgCodes: ['ABC']
    }

    const phoneNumbers = getPhoneNumbersToSendTo(users, message)

    expect(phoneNumbers).toHaveLength(1)
    expect(phoneNumbers[0]).toEqual(users[0].phoneNumbers[0].number)
  })

  test('only active users have their phone numbers returned', () => {
    const users = [{
      active: true,
      orgCode: 'ABC',
      phoneNumbers: [{
        number: '07777111111',
        subscribedTo: ['ANY:anything']
      }]
    }, {
      active: false,
      orgCode: 'ABC',
      phoneNumbers: [{
        number: '07888111111',
        subscribedTo: ['ANY:anything']
      }]
    }]
    const message = {
      allOffices: true,
      officeCodes: [],
      orgCodes: ['ABC']
    }

    const phoneNumbers = getPhoneNumbersToSendTo(users, message)

    expect(phoneNumbers).toHaveLength(1)
    expect(phoneNumbers[0]).toEqual(users[0].phoneNumbers[0].number)
  })
})
