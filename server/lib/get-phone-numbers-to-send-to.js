module.exports = (users, message) => {
  const phoneNumbers = []
  users.forEach(user => {
    user.phoneNumbers?.forEach(pn => {
      if (message.officeCodes.some(oc => pn.subscribedTo?.includes(oc))) {
        phoneNumbers.push(pn.number)
      }
    })
  })
  return phoneNumbers
}
