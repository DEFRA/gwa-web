const cheerio = require('cheerio')
const cleanUpTableText = require('../../helpers/clean-up-table-text')
const { navigation } = require('../../../server/constants')
const createServer = require('../../../server/index')
const { scopes } = require('../../../server/permissions')
const { formatDate } = require('../../../server/lib/misc/helpers')

describe('System status route', () => {
  const email = 'test@gwa.defra.co.uk'
  const id = 'guid'
  const url = '/system-status'
  let server

  jest.mock('../../../server/lib/view/get-data-items-table')
  const getDataItemsTable = require('../../../server/lib/view/get-data-items-table')
  jest.mock('../../../server/lib/view/get-user-stats-table')
  const getUserStatsTable = require('../../../server/lib/view/get-user-stats-table')

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('responds with 302 when no user is logged in', async () => {
    const res = await server.inject({
      method: 'GET',
      url
    })

    expect(res.statusCode).toEqual(302)
  })

  test('responds with 403 when user does not have sufficient scope', async () => {
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id,
            email,
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify([])
            }
          },
          scope: []
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(403)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-body').text()).toEqual('Insufficient scope')
  })

  test.each([
    { scope: [scopes.data.manage] },
    { scope: [scopes.data.manage, scopes.message.manage] }
  ])('responds with 200 when user has sufficient scope', async ({ scope }) => {
    const dataItemsHead = [{ text: 'Data item' }, { text: 'File' }, { text: 'Last modified' }]
    const dataItemsRows = [[{ text: 'Data item extract' }, { text: 'extact.json' }, { text: formatDate(Date.now()) }]]
    getDataItemsTable.mockResolvedValue({ head: dataItemsHead, rows: dataItemsRows })
    const userStatsHead = [{ text: 'Organisation' }, { text: 'Active users' }, { text: 'Inactive users' }]
    const userStatsRows = [[{ text: 'DEFRA' }, { text: '1' }, { text: '0' }]]
    getUserStatsTable.mockResolvedValue({ head: userStatsHead, rows: userStatsRows })
    const res = await server.inject({
      method: 'GET',
      url,
      auth: {
        credentials: {
          user: {
            id,
            email,
            displayName: 'test gwa',
            raw: {
              roles: JSON.stringify([])
            }
          },
          scope
        },
        strategy: 'azuread'
      }
    })

    expect(res.statusCode).toEqual(200)

    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toMatch('System status')
    expect($('.govuk-header__navigation-item--active').text()).toMatch(navigation.header.systemStatus.text)
    expect($('.govuk-phase-banner')).toHaveLength(0)
    const headings = $('.govuk-heading-m')
    expect(headings).toHaveLength(3)
    expect(headings.eq(0).text()).toEqual('Data items')
    expect(headings.eq(1).text()).toEqual('User stats')
    expect(headings.eq(2).text()).toEqual('Notify service')
    const tables = $('table')
    expect(tables).toHaveLength(2)
    expect(cleanUpTableText($('thead tr', tables.eq(0)).text())).toMatch(dataItemsHead.map(x => x.text).join(' '))
    expect(cleanUpTableText($('tbody tr', tables.eq(0)).text())).toMatch(dataItemsRows[0].map(x => x.text).join(' '))
    expect(cleanUpTableText($('thead tr', tables.eq(1)).text())).toMatch(userStatsHead.map(x => x.text).join(' '))
    expect(cleanUpTableText($('tbody tr', tables.eq(1)).text())).toMatch(userStatsRows[0].map(x => x.text).join(' '))
  })
})
