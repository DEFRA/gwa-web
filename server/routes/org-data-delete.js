const Joi = require('joi')
const { scopes } = require('../permissions')
const deleteOrgData = require('../lib/data/delete-org-data')
const { getMappedErrors } = require('../lib/misc/errors')
const BaseModel = require('../lib/misc/model')
const generateNonCoreOrgSelectItems = require('../lib/view/non-core-org-select')

const errorMessages = {
  orgCode: { '*': 'Select an organisation' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const routeId = 'org-data-delete'
const path = `/${routeId}`

const auth = { access: { scope: [`+${scopes.data.manage}`] } }

async function getOrgSelectList (request, orgCode) {
  const orgList = await request.server.methods.db.getOrganisationList()
  return generateNonCoreOrgSelectItems(orgList, orgCode)
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const organisations = await getOrgSelectList(request)

      return h.view(routeId, new Model({ organisations }))
    },
    options: {
      auth
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { orgCode } = request.payload
      const deletionSuccess = await deleteOrgData(orgCode)

      if (!deletionSuccess) {
        const organisations = await getOrgSelectList(request, orgCode)
        const errors = { orgCode: 'No file exists for the selected organisation' }
        return h.view(routeId, new Model({ organisations }, errors))
      }

      return h.redirect('/org-data')
    },
    options: {
      auth,
      validate: {
        payload: Joi.object().keys({
          orgCode: Joi.string().required()
        }),
        failAction: async (request, h, err) => {
          const organisations = await getOrgSelectList(request)
          const errors = getMappedErrors(err, errorMessages)

          return h.view(routeId, new Model({ organisations }, errors)).takeover()
        }
      }
    }
  }
]
