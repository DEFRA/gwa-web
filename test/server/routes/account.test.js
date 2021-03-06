const cheerio = require('cheerio')
const createServer = require('../../../server/index')
const { navigation } = require('../../../server/constants')

describe('Account route', () => {
  let server
  const email = 'test@gwa.defra.gov.uk'
  const givenName = 'givenName'
  const mockPhoneNumbers = [
    { type: 'corporate', number: '07777111111', subscribedTo: ['OFFICE'] },
    { type: 'personal', number: '07777222222', subscribedTo: ['THIS', 'THAT'] }
  ]
  const orgName = 'name of the organisation'
  const officeLocation = 'where the office is'
  const surname = 'surname'
  const url = '/account'
  const baseUser = {
    id: email,
    active: true,
    givenName,
    surname,
    officeLocation,
    orgName
  }
  const userWithCorpAndPersonalNumber = {
    ...baseUser,
    phoneNumbers: mockPhoneNumbers
  }
  const userWithTwoCorpNoPersonalNumbers = {
    ...baseUser,
    phoneNumbers: [mockPhoneNumbers[0], mockPhoneNumbers[0]]
  }

  jest.mock('../../../server/lib/db')
  const { getUser } = require('../../../server/lib/db')
  getUser
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ active: false })
    .mockResolvedValueOnce(userWithCorpAndPersonalNumber)
    .mockResolvedValueOnce(userWithTwoCorpNoPersonalNumbers)

  beforeEach(async () => {
    jest.clearAllMocks()

    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 302 when no user exists', async () => {
    const res = await server.inject({
      method: 'GET',
      url
    })

    expect(res.statusCode).toEqual(302)
  })

  test('responds with 404 when user is not found', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa'
          },
          roles: [],
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(404)
  })

  test('responds with 404 when user is found but is not active', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa'
          },
          roles: [],
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(404)
  })

  test('responds with 200 and account view with correctly grouped phone numbers when active user is found', async () => {
    const roles = ['Zanns', 'Toaster', 'Adder']
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa'
          },
          roles,
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(200)
    const $ = cheerio.load(res.payload)

    expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.account.text)
    expect($('.govuk-phase-banner')).toHaveLength(0)

    expect($('.govuk-heading-l').text()).toEqual('Account')
    const accountOverview = $('.govuk-grid-column-two-thirds p')
    expect(accountOverview.eq(0).text()).toMatch(`Name: ${givenName} ${surname}`)
    expect(accountOverview.eq(1).text()).toMatch(`Email: ${email}`)
    expect(accountOverview.eq(2).text()).toMatch(`Office Location: ${officeLocation}`)
    expect(accountOverview.eq(3).text()).toMatch(`Organisation: ${orgName}`)
    expect(accountOverview.eq(4).text()).toMatch(`Roles: ${roles.sort().join(', ')}`)

    const phoneNumberTables = $('table.govuk-table')
    expect(phoneNumberTables).toHaveLength(2)
    expect($('caption', phoneNumberTables[0]).text()).toEqual('Corporate phone number')
    expect($('.govuk-table__header', phoneNumberTables[0]).text()).toEqual(mockPhoneNumbers[0].number)
    expect($('.govuk-table__cell', phoneNumberTables[0]).eq(0).text()).toEqual('subscribed to 1 area')
    expect($('caption', phoneNumberTables[1]).text()).toEqual('Personal phone number')
    expect($('.govuk-table__header', phoneNumberTables[1]).text()).toEqual(mockPhoneNumbers[1].number)
    expect($('.govuk-table__cell', phoneNumberTables[1]).eq(0).text()).toEqual('subscribed to 2 areas')

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(3)
    expect(buttons.eq(0).text()).toEqual(`Edit ${userWithCorpAndPersonalNumber.phoneNumbers[0].number}`)
    expect(buttons.eq(1).text()).toEqual(`Edit ${userWithCorpAndPersonalNumber.phoneNumbers[1].number}`)
    expect(buttons.eq(2).text()).toMatch('Sign out')
  })

  test('add new contact button is available when user has fewer than max personal phone numbers possible', async () => {
    const roles = ['One']
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa'
          },
          roles,
          scope: []
        },
        strategy: 'azuread'
      }
    })

    const $ = cheerio.load(res.payload)

    const phoneNumberTables = $('table.govuk-table')
    expect($('caption', phoneNumberTables[0]).text()).toEqual('Corporate phone numbers')

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(4)
    expect(buttons.eq(0).text()).toEqual(`Edit ${userWithTwoCorpNoPersonalNumbers.phoneNumbers[0].number}`)
    expect(buttons.eq(1).text()).toEqual(`Edit ${userWithTwoCorpNoPersonalNumbers.phoneNumbers[1].number}`)
    expect(buttons.eq(2).text()).toMatch('Add new contact')
    expect(buttons.eq(3).text()).toMatch('Sign out')
    const accountOverview = $('.govuk-grid-column-two-thirds p')
    expect(accountOverview.eq(4).text()).toMatch(`Role: ${roles.sort().join(', ')}`)
  })
})
