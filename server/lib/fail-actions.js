const boom = require('@hapi/boom')

const BaseModel = require('../lib/model')
const { getMappedErrors } = require('./errors')
const { getAreaToOfficeMap, getOrganisationList } = require('./db')
const generateOfficeCheckboxes = require('./office-checkboxes')
const generateOrganisationCheckboxes = require('./organisation-checkboxes')
const generateSendToAllOrgsRadios = require('./send-to-all-radios')
const { message: errorMessages } = require('./error-messages')
const { textMessages: { maxMessageLength } } = require('../constants')

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = {
  message: {
    failAction: async (request, h, err, routeId) => {
      const errors = getMappedErrors(err, errorMessages)

      const areaToOfficeMap = await getAreaToOfficeMap()
      const organisationList = await getOrganisationList()

      if (!areaToOfficeMap || !organisationList) {
        return boom.internal('Reference data not found.')
      }

      let { allOffices, officeCodes, orgCodes } = request.payload
      if (typeof (officeCodes) === 'string') {
        officeCodes = [officeCodes]
      }
      if (typeof (orgCodes) === 'string') {
        orgCodes = [orgCodes]
      }
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap, officeCodes)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList, orgCodes)
      const allOfficeRadios = generateSendToAllOrgsRadios(allOffices)

      return h.view(routeId, new Model({ ...request.payload, allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }, errors)).takeover()
    }
  }
}
