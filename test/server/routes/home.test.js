const cheerio = require('cheerio')
const { navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')

describe('Home route', () => {
  const url = '/'
  let server

  beforeEach(async () => {
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 200 when no user is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    const nav = $('#navigation li')
    expect(nav).toHaveLength(2)
    expect(nav.eq(0).text()).toMatch('Home')
    expect(nav.eq(1).text()).toMatch('Sign in')
  })

  test('responds with 200 when user with no scope is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: []
            }
          },
          scope: []
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-phase-banner')).toHaveLength(0)
    expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.home.text)

    const nav = $('#navigation li a')
    expect(nav).toHaveLength(3)
    expect(nav.eq(0).text()).toMatch('Home')
    expect(nav.eq(0).attr('href')).toEqual('/')
    expect(nav.eq(1).text()).toMatch('Account')
    expect(nav.eq(1).attr('href')).toEqual('/account')
    expect(nav.eq(2).text()).toMatch('Sign out')
    expect(nav.eq(2).attr('href')).toEqual('/logout')

    const headings = $('.govuk-grid-column-two-thirds .govuk-heading-m')
    expect(headings).toHaveLength(1)
    expect(headings.eq(0).text()).toMatch('You can:')

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(1)
    expect(buttons.eq(0).text()).toMatch('Account')
    expect(buttons.eq(0).attr('href')).toEqual('/account')
  })

  test('responds with 200 when user with DataManager role scope is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: []
            }
          },
          scope: [scopes.data.manage]
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    const nav = $('#navigation li a')
    expect(nav).toHaveLength(5)
    expect(nav.eq(0).text()).toMatch('Home')
    expect(nav.eq(0).attr('href')).toEqual('/')
    expect(nav.eq(1).text()).toMatch('Account')
    expect(nav.eq(1).attr('href')).toEqual('/account')
    expect(nav.eq(2).text()).toMatch('Manage data')
    expect(nav.eq(2).attr('href')).toEqual('/data-manage')
    expect(nav.eq(3).text()).toMatch('System status')
    expect(nav.eq(3).attr('href')).toEqual('/system-status')
    expect(nav.eq(4).text()).toMatch('Sign out')
    expect(nav.eq(4).attr('href')).toEqual('/logout')

    const headings = $('.govuk-grid-column-two-thirds .govuk-heading-m')
    expect(headings).toHaveLength(2)
    expect(headings.eq(0).text()).toMatch('You can:')
    expect(headings.eq(1).text()).toMatch('Data managers can:')

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(3)
    expect(buttons.eq(0).text()).toMatch('Account')
    expect(buttons.eq(0).attr('href')).toEqual('/account')
    expect(buttons.eq(1).text()).toMatch('Manage data')
    expect(buttons.eq(1).attr('href')).toEqual('/data-manage')
    expect(buttons.eq(2).text()).toMatch('System status')
    expect(buttons.eq(2).attr('href')).toEqual('/system-status')
  })

  test('responds with 200 when user with Administrator role scope is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          profile: {
            id: 'guid',
            email: 'test@gwa.defra.co.uk',
            displayName: 'test gwa',
            raw: {
              roles: []
            }
          },
          scope: [scopes.data.manage, scopes.message.manage]
        },
        strategy: 'try'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    const nav = $('#navigation li a')
    expect(nav).toHaveLength(6)
    expect(nav.eq(0).text()).toMatch('Home')
    expect(nav.eq(0).attr('href')).toEqual('/')
    expect(nav.eq(1).text()).toMatch('Account')
    expect(nav.eq(1).attr('href')).toEqual('/account')
    expect(nav.eq(2).text()).toMatch('Manage data')
    expect(nav.eq(2).attr('href')).toEqual('/data-manage')
    expect(nav.eq(3).text()).toMatch('Messages')
    expect(nav.eq(3).attr('href')).toEqual('/messages')
    expect(nav.eq(4).text()).toMatch('System status')
    expect(nav.eq(4).attr('href')).toEqual('/system-status')
    expect(nav.eq(5).text()).toMatch('Sign out')
    expect(nav.eq(5).attr('href')).toEqual('/logout')

    const headings = $('.govuk-grid-column-two-thirds .govuk-heading-m')
    expect(headings).toHaveLength(3)
    expect(headings.eq(0).text()).toMatch('You can:')
    expect(headings.eq(1).text()).toMatch('Data managers can:')
    expect(headings.eq(2).text()).toMatch('Administrators can:')

    const buttons = $('.govuk-button')
    expect(buttons).toHaveLength(4)
    expect(buttons.eq(0).text()).toMatch('Account')
    expect(buttons.eq(0).attr('href')).toEqual('/account')
    expect(buttons.eq(1).text()).toMatch('Manage data')
    expect(buttons.eq(1).attr('href')).toEqual('/data-manage')
    expect(buttons.eq(2).text()).toMatch('System status')
    expect(buttons.eq(2).attr('href')).toEqual('/system-status')
    expect(buttons.eq(3).text()).toMatch('Messages')
    expect(buttons.eq(3).attr('href')).toEqual('/messages')
  })
})
