const { getMappedErrors } = require('../misc/errors')
const BaseModel = require('../misc/model')
const generateOfficeCheckboxes = require('../view/office-checkboxes')
const generateOrganisationCheckboxes = require('../view/organisation-checkboxes')
const sendToAllRadios = require('../view/send-to-all-radios')
const { errorMessages, textMessages: { maxMessageLength } } = require('../../constants')

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = {
  message: {
    failAction: async (request, h, err, routeId) => {
      const errors = getMappedErrors(err, errorMessages)

      let { allOffices, allOrgs, officeCodes, orgCodes } = request.payload
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
      const allOfficeRadios = sendToAllRadios(allOffices)
      const allOrgRadios = sendToAllRadios(allOrgs)

      return h.view(routeId, new Model({ ...request.payload, allOfficeRadios, allOrgRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }, errors)).takeover()
    }
  }
}
