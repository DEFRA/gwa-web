const BaseModel = require('../lib/model')
const { getMappedErrors } = require('./errors')
const generateOfficeCheckboxes = require('./office-checkboxes')
const generateOrganisationCheckboxes = require('./organisation-checkboxes')
const generateSendToAllOrgsRadios = require('./send-to-all-radios')
const { errorMessages, textMessages: { maxMessageLength } } = require('../constants')

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = {
  message: {
    failAction: async (request, h, err, routeId) => {
      const errors = getMappedErrors(err, errorMessages)

      let { allOffices, officeCodes, orgCodes } = request.payload
      if (typeof (officeCodes) === 'string') {
        officeCodes = [officeCodes]
      }
      if (typeof (orgCodes) === 'string') {
        orgCodes = [orgCodes]
      }
      const [areaToOfficeMap, organisationList] = await Promise.all([
        request.server.methods.db.getAreaToOfficeMap(),
        request.server.methods.db.getOrganisationList()
      ])
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, officeCodes)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList, orgCodes)
      const allOfficeRadios = generateSendToAllOrgsRadios(allOffices)

      return h.view(routeId, new Model({ ...request.payload, allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }, errors)).takeover()
    }
  }
}
