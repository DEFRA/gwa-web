function isMessageForAllOfficesAndIsPhoneNumberSubscribedToAtLeastOneOffice (message, phoneNumber) {
  return message.allOffices && phoneNumber.subscribedTo.length > 0
}

function isMessageForAllOfficesInAnAreaAndDoesPhoneNumberSubscribeToAnyOfficesInTheArea (message, phoneNumber) {
  return message.officeCodes
    .filter(oc => oc.split(':')[1] === '*')
    .map(oc => oc.split(':')[0])
    .some(c => phoneNumber.subscribedTo.map(soc => soc.split(':')[0]).includes(c))
}

function isMessageForSingleOfficeAndDoesPhoneNumberSubscribeToAllOfficesInTheArea (message, phoneNumber) {
  return phoneNumber.subscribedTo
    .filter(soc => soc.split(':')[1] === '*')
    .map(oc => oc.split(':')[0])
    .some(sc => message.officeCodes.map(oc => oc.split(':')[0]).includes(sc))
}

/**
 * Get phone numbers (from the list of users), to send the message to based on
 * the criteria of the message.
 *
 * @param {Array} users list of users from which to extract phone numbers, must
 * contain properties - `active`, `orgCode`, `phoneNumbers`.
 * @param {object} message representing message specification.
 * @returns {Array} list of phone numbers to send the message to.
 */
module.exports = (users, message) => {
  const phoneNumbers = []
  users
    .filter(x => x.active)
    .filter(x => message.allOrgs ? true : message.orgCodes.includes(x.orgCode))
    .forEach(user => {
      user.phoneNumbers.forEach(pn => {
        if (isMessageForAllOfficesAndIsPhoneNumberSubscribedToAtLeastOneOffice(message, pn) ||
        isMessageForAllOfficesInAnAreaAndDoesPhoneNumberSubscribeToAnyOfficesInTheArea(message, pn) ||
        isMessageForSingleOfficeAndDoesPhoneNumberSubscribeToAllOfficesInTheArea(message, pn) ||
        message.officeCodes.some(oc => pn.subscribedTo.includes(oc))) {
          phoneNumbers.push(pn.number)
        }
      })
    })
  return phoneNumbers
}
