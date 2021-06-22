const cheerio = require('cheerio')
const createServer = require('../../../server/index')

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

  jest.mock('../../../server/lib/db', () => {
    return {
      getUser: jest.fn()
        .mockResolvedValue({
          id: email,
          active: true,
          phoneNumbers: mockPhoneNumbers,
          givenName,
          surname,
          officeLocation,
          orgName
        })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ active: false })
    }
  })

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

  test('responds with 200 and account view when active user is found', async () => {
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

    expect($('.govuk-heading-l').text()).toEqual('Account')
    const accountOverview = $('.govuk-grid-column-two-thirds p')
    expect(accountOverview.eq(0).text()).toMatch(`Name: ${givenName} ${surname}`)
    expect(accountOverview.eq(1).text()).toMatch(`Email: ${email}`)
    expect(accountOverview.eq(2).text()).toMatch(`Office Location: ${officeLocation}`)
    expect(accountOverview.eq(3).text()).toMatch(`Organisation: ${orgName}`)
    expect(accountOverview.eq(4).text()).toMatch(`Role(s): ${roles.sort().join(', ')}`)
  })

  test('phone numbers are grouped correctly when active user is found', async () => {
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

    const $ = cheerio.load(res.payload)

    const phoneNumberTables = $('table.govuk-table')
    expect(phoneNumberTables).toHaveLength(2)
    expect($('caption', phoneNumberTables[0]).text()).toEqual('Corporate phone number(s)')
    expect($('.govuk-table__header', phoneNumberTables[0]).text()).toEqual(mockPhoneNumbers[0].number)
    expect($('.govuk-table__cell', phoneNumberTables[0]).eq(0).text()).toEqual('member of 1 group')
    expect($('caption', phoneNumberTables[1]).text()).toEqual('Personal phone number(s)')
    expect($('.govuk-table__header', phoneNumberTables[1]).text()).toEqual(mockPhoneNumbers[1].number)
    expect($('.govuk-table__cell', phoneNumberTables[1]).eq(0).text()).toEqual('member of 2 groups')
    expect($('.govuk-button')).toHaveLength(4)
    expect($('.govuk-button').eq(0).text()).toEqual('Edit')
    expect($('.govuk-button').eq(1).text()).toEqual('Edit')
    expect($('.govuk-button').eq(2).text()).toMatch('Add new contact')
    expect($('.govuk-button').eq(3).text()).toMatch('Sign out')
  })

  test('add new contact button is not displayed when user has max personal phone numbers', async () => {
    mockPhoneNumbers.push({ type: 'personal', number: '07777333333', subscribedTo: ['CAFE', 'HOME', 'MORE'] })
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

    const $ = cheerio.load(res.payload)

    const phoneNumberTables = $('table.govuk-table')
    expect(phoneNumberTables).toHaveLength(2)
    const [corporate, personal] = phoneNumberTables
    expect($('caption', corporate).text()).toEqual('Corporate phone number(s)')
    expect($('.govuk-table__header', corporate).text()).toEqual(mockPhoneNumbers[0].number)
    expect($('.govuk-table__cell', corporate).eq(0).text()).toEqual('member of 1 group')
    expect($('caption', personal).text()).toEqual('Personal phone number(s)')
    expect($('.govuk-table__header', personal).eq(0).text()).toEqual(mockPhoneNumbers[1].number)
    expect($('.govuk-table__cell', personal).eq(0).text()).toEqual('member of 2 groups')
    expect($('.govuk-table__header', personal).eq(1).text()).toEqual(mockPhoneNumbers[2].number)
    expect($('.govuk-table__cell', personal).eq(2).text()).toEqual('member of 3 groups')
    expect($('.govuk-button')).toHaveLength(4)
    expect($('.govuk-button').eq(0).text()).toEqual('Edit')
    expect($('.govuk-button').eq(1).text()).toEqual('Edit')
    expect($('.govuk-button').eq(2).text()).toMatch('Edit')
    expect($('.govuk-button').eq(3).text()).toMatch('Sign out')
  })
})
