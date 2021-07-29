const Joi = require('joi')
const { scopes } = require('../permissions')
const convertUsersJSONToCSV = require('../lib/data/convert-users-json-to-csv')
const deleteOrgData = require('../lib/data/delete-org-data')
const downloadOrgData = require('../lib/data/download-org-data')
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

const path = '/org-data-{section}'

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
      const { section } = request.params
      console.log(request.params)
      const organisations = await getOrgSelectList(request)

      return h.view(`org-data-${section}`, new Model({ organisations }))
    },
    options: {
      auth,
      validate: {
        params: Joi.object().keys({
          section: Joi.string().valid('delete', 'download').required()
        })
      }
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { orgCode } = request.payload
      const { section } = request.params
      if (section === 'download') {
        const data = await downloadOrgData(orgCode)
        if (data) {
          const csvData = await convertUsersJSONToCSV(data)
          return h.response(csvData)
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename=${orgCode}.csv`)
        }
      } else {
        const deletionSuccess = await deleteOrgData(orgCode)
        if (deletionSuccess) {
          return h.redirect('/org-data')
        }
      }

      const organisations = await getOrgSelectList(request, orgCode)
      const errors = { orgCode: 'No file exists for the selected organisation' }
      return h.view(`org-data-${section}`, new Model({ organisations }, errors))
    },
    options: {
      auth,
      validate: {
        payload: Joi.object().keys({
          orgCode: Joi.string().required()
        }),
        failAction: async (request, h, err) => {
          const { section } = request.params
          const organisations = await getOrgSelectList(request)
          const errors = getMappedErrors(err, errorMessages)

          return h.view(`org-data-${section}`, new Model({ organisations }, errors)).takeover()
        }
      }
    }
  }
]
