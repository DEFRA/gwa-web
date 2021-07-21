const notifyStatusViewData = {
  service: {
    description: 'All Systems Go!',
    tag: 'govuk-tag--green'
  },
  componentRows: [[
    { text: 'component name' },
    { html: '<strong class="govuk-tag govuk-tag--green">operational</strong>' }
  ]],
  lastChecked: Date.now()
}

function expectNotifyStatus ($) {
  const notifyStatus = $('.govuk-grid-column-one-third')
  expect(notifyStatus).toHaveLength(1)
  expect($('h2', notifyStatus).text()).toEqual('GOV.UK Notify Status')
  const statusTags = $('.govuk-tag', notifyStatus)
  expect(statusTags).toHaveLength(notifyStatusViewData.componentRows.length + 1)
  expect($(statusTags).eq(0).text()).toEqual(notifyStatusViewData.service.description)
  expect($(statusTags).eq(1).text()).toEqual($(notifyStatusViewData.componentRows[0][1].html).text())
}

module.exports = {
  expectNotifyStatus,
  notifyStatusViewData
}
