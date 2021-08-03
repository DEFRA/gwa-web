describe('Getting user stats status table', () => {
  const activeUserCount = 420
  const inactiveUserCount = 99
  const orgCode = 'orgCode'

  const getUserStatsTable = require('../../../../server/lib/view/get-user-stats-table')

  jest.mock('../../../../server/lib/db')
  const { getUserStats } = require('../../../../server/lib/db')

  test('table has head and rows', async () => {
    getUserStats.mockResolvedValue([])

    const table = await getUserStatsTable()

    expect(table).toHaveProperty('head')
    expect(table.head).toEqual([{ text: 'Organisation' }, { text: 'Active users' }, { text: 'Inactive users' }])
    expect(table).toHaveProperty('rows')
    expect(table.rows).toEqual([])
  })

  test('rows contain correct user counts', async () => {
    const queryResult = [{
      active: true,
      count: activeUserCount,
      orgCode
    }, {
      active: false,
      count: inactiveUserCount,
      orgCode
    }]
    getUserStats.mockResolvedValue(queryResult)

    const table = await getUserStatsTable()

    expect(table.rows).toHaveLength(1)
    expect(table.rows[0][0].text).toEqual(orgCode)
    expect(table.rows[0][1].text).toEqual(activeUserCount)
    expect(table.rows[0][2].text).toEqual(inactiveUserCount)
  })

  test.each([
    { active: true, userCount: 99 },
    { active: false, userCount: 99 }
  ])('rows default to 0 when only one count for org is returned', async ({ active, userCount }) => {
    const queryResult = [{
      active,
      count: userCount,
      orgCode
    }]
    getUserStats.mockResolvedValue(queryResult)

    const table = await getUserStatsTable()

    expect(table.rows).toHaveLength(1)
    expect(table.rows[0][0].text).toEqual(orgCode)
    expect(table.rows[0][1].text).toEqual(active ? userCount : 0)
    expect(table.rows[0][2].text).toEqual(!active ? userCount : 0)
  })

  test('rows are ordered by orgCode', async () => {
    const queryResult = [{
      active: false,
      count: inactiveUserCount,
      orgCode: 'XYZ'
    }, {
      active: true,
      count: activeUserCount,
      orgCode: 'XYZ'
    }, {
      active: false,
      count: inactiveUserCount,
      orgCode: 'ABC'
    }, {
      active: true,
      count: activeUserCount,
      orgCode: 'LMN'
    }]
    getUserStats.mockResolvedValue(queryResult)

    const table = await getUserStatsTable()

    expect(table.rows).toHaveLength(3)
    expect(table.rows[0][0].text).toEqual('ABC')
    expect(table.rows[0][1].text).toEqual(0)
    expect(table.rows[0][2].text).toEqual(inactiveUserCount)
    expect(table.rows[1][0].text).toEqual('LMN')
    expect(table.rows[1][1].text).toEqual(activeUserCount)
    expect(table.rows[1][2].text).toEqual(0)
    expect(table.rows[2][0].text).toEqual('XYZ')
    expect(table.rows[2][1].text).toEqual(activeUserCount)
    expect(table.rows[2][2].text).toEqual(inactiveUserCount)
  })
})
