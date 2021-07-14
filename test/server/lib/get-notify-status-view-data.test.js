describe('Notify status view data', () => {
  const { getComponentTag, getServiceTag } = require('../../../server/lib/helpers')
  const getNotifyStatusViewData = require('../../../server/lib/get-notify-status-view-data')
  const mockResponse = require('../../data/notify-summary-example.json')

  const fetch = require('node-fetch')
  jest.mock('node-fetch')

  const lastCheckDate = Date.now()
  Date.now = jest.fn(() => lastCheckDate)

  async function mockFetchResolvedJsonValueOnce (val) {
    fetch.mockResolvedValueOnce({ json: async () => { return val } })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('request is made to Notify summary status page', async () => {
    mockFetchResolvedJsonValueOnce(mockResponse)

    await getNotifyStatusViewData()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('https://status.notifications.service.gov.uk/api/v2/summary.json')
  })

  test('data is correctly constructed for view', async () => {
    mockFetchResolvedJsonValueOnce(mockResponse)

    const data = await getNotifyStatusViewData()

    expect(data).toHaveProperty('service')
    expect(data.service).toHaveProperty('description')
    expect(data.service.description).toEqual(mockResponse.status.description)
    expect(data.service).toHaveProperty('tag')
    expect(data.service.tag).toEqual(getServiceTag(mockResponse.status.indicator))
    expect(data).toHaveProperty('componentRows')
    expect(data.componentRows).toHaveLength(mockResponse.components.length)
    const componentRows = data.componentRows
    componentRows.forEach((c, i) => {
      expect(c[0].text).toEqual(mockResponse.components[i].name)
      const status = mockResponse.components[i].status
      expect(c[1].html).toEqual(`<strong class="govuk-tag ${getComponentTag(status)}">${status}</strong>`)
    })
    expect(data).toHaveProperty('lastChecked')
    expect(data.lastChecked).toEqual(new Date(lastCheckDate).toLocaleString())
  })

  test.each([
    { indicator: 'none', expectedTag: 'govuk-tag--green' },
    { indicator: 'minor', expectedTag: 'govuk-tag--yellow' },
    { indicator: 'major', expectedTag: 'govuk-tag--orange' },
    { indicator: 'critical', expectedTag: 'govuk-tag--red' },
    { indicator: 'default', expectedTag: 'govuk-tag--grey' }
  ])('service tag is updated according to indicator', async ({ indicator, expectedTag }) => {
    const description = `human phrase for ${indicator}`
    const input = { ...mockResponse, status: { indicator, description } }
    mockFetchResolvedJsonValueOnce(input)

    const data = await getNotifyStatusViewData()

    expect(data.service.description).toEqual(description)
    expect(data.service.tag).toEqual(expectedTag)
  })

  test.each([
    { status: 'operational', expectedTag: 'govuk-tag--green' },
    { status: 'degraded_performance', expectedTag: 'govuk-tag--yellow' },
    { status: 'partial_outage', expectedTag: 'govuk-tag--orange' },
    { status: 'major_outage', expectedTag: 'govuk-tag--red' },
    { status: 'default', expectedTag: 'govuk-tag--grey' }
  ])('componentRows are correctly tagged based on status', async ({ status, expectedTag }) => {
    const name = 'Text message sending'
    const components = [{
      name,
      status
    }]
    const input = { ...mockResponse, components }
    mockFetchResolvedJsonValueOnce(input)

    const data = await getNotifyStatusViewData()

    const actualComponents = data.componentRows
    expect(actualComponents).toHaveLength(components.length)
    expect(actualComponents[0][0].text).toEqual(name)
    expect(actualComponents[0][1].html).toEqual(`<strong class="govuk-tag ${expectedTag}">${status}</strong>`)
    expect(data.service.tag).toEqual(getServiceTag(mockResponse.status.indicator))
  })

  test('data is correctly constructed for view when error occurs during Notify status retrieval', async () => {
    fetch.mockRejectedValueOnce({ json: async () => { return new Error('busted') } })

    const data = await getNotifyStatusViewData()

    expect(data.service.description).toEqual('Unknown')
    expect(data.service.tag).toEqual('govuk-tag--grey')
    expect(data.componentRows).toEqual([])
    expect(data.lastChecked).toEqual(new Date(lastCheckDate).toLocaleString())
  })
})
