const Joi = require('joi')
const { parseAsync } = require('json2csv')

const { scopes } = require('../permissions')
const { getMappedErrors } = require('../lib/misc/errors')
const BaseModel = require('../lib/misc/model')
const generateNonCoreOrgSelectItems = require('../lib/view/non-core-org-select')
const downloadOrgData = require('../lib/data/download-org-data')

const errorMessages = {
  orgCode: { '*': 'Select an organisation' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const routeId = 'org-data-download'
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
      const data = await downloadOrgData(orgCode)

      if (!data) {
        const organisations = await getOrgSelectList(request, orgCode)
        const errors = { orgCode: 'No file exists for selected organisation' }
        return h.view(routeId, new Model({ organisations }, errors))
      }

      // TODO: convert json to csv, extract phone number - currently an array
      const csvdata = await parseAsync(JSON.parse(data))
      console.log(csvdata)
      return h.response(data).header('Content-Type', 'text/html')
    },
    options: {
      auth,
      validate: {
        payload: Joi.object().keys({
          orgCode: Joi.string().required()
        }),
        failAction: async (request, h, err) => {
          const { orgCode } = request.payload
          const organisations = await getOrgSelectList(request, orgCode)
          const errors = getMappedErrors(err, errorMessages)

          return h.view(routeId, new Model({ organisations }, errors)).takeover()
        }
      }
    }
  }
]
