module.exports = (organisationList) => {
  return organisationList.map(o => { return { text: o.orgDescription, value: o.orgCode } })
}
