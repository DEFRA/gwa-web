const Joi = require('joi')

const { getOrganisationMap } = require('../lib/db')
const { scopes } = require('../permissions')
const { types } = require('../lib/reference-data')
const { getOrganisationListCSV, getOrganisationMapCSV, getStandardisedOfficeLocationMap } = require('../lib/get-reference-data')

module.exports = [
  {
    method: 'GET',
    path: '/data-reference-download/{type}',
    handler: async (request, h) => {
      let fileContents
      const { type } = request.params
      switch (type) {
        case types.orgList: {
          await request.server.methods.db.getOrganisationList.cache.drop()
          const organisationList = await request.server.methods.db.getOrganisationList()
          fileContents = await getOrganisationListCSV(organisationList)
          break
        }
        case types.orgMap: {
          const organisationMap = await getOrganisationMap()
          fileContents = await getOrganisationMapCSV(organisationMap)
          break
        }
        case types.officeLocations: {
          await request.server.methods.db.getStandardisedOfficeLocationMap.cache.drop()
          const officeLocationMap = await request.server.methods.db.getStandardisedOfficeLocationMap()
          fileContents = await getStandardisedOfficeLocationMap(officeLocationMap)
          break
        }
      }
      return h.response(fileContents).header('Content-Type', 'text/csv')
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.data.manage}`]
        }
      },
      validate: {
        params: Joi.object().keys({
          type: Joi.string().valid(types.officeLocations, types.orgList, types.orgMap).required()
        })
      }
    }
  }
]
