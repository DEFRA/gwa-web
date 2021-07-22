const boom = require('@hapi/boom')
const Joi = require('joi')

const { orgDataFileHeaders } = require('../constants')
const { scopes } = require('../permissions')
const convertCSVToJSON = require('../lib/data/convert-users-csv-to-json')
const { getMappedErrors } = require('../lib/misc/errors')
const BaseModel = require('../lib/misc/model')
const generateNonCoreOrgSelectItems = require('../lib/view/non-core-org-select')
const uploadUserData = require('../lib/data/upload-user-data')
const validateUsers = require('../lib/data/validate-users')

const errorMessages = {
  file: { '*': 'Select a valid CSV file' },
  orgCode: { '*': 'Select an organisation' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const routeId = 'org-data-upload'
const path = `/${routeId}`

const auth = { access: { scope: [`+${scopes.data.manage}`] } }

function anyDuplicates (valid) {
  return new Map(valid.map(x => [x.emailAddress, x])).size !== valid.length
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const orgList = await request.server.methods.db.getOrganisationList()
      const organisations = generateNonCoreOrgSelectItems(orgList)

      return h.view(routeId, new Model({ headers: orgDataFileHeaders, organisations }))
    },
    options: {
      auth
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { file: fileStream, orgCode } = request.payload
      const { filename } = fileStream.hapi
      const orgList = await request.server.methods.db.getOrganisationList()
      const organisations = generateNonCoreOrgSelectItems(orgList, orgCode)

      if (!filename || !filename.endsWith('.csv')) {
        const errors = { file: errorMessages.file['*'] }
        return h.view(routeId, new Model({ headers: orgDataFileHeaders, organisations }, errors))
      }

      const organisation = orgList.filter(o => o.orgCode === orgCode)[0]
      if (!organisation) {
        return boom.badRequest(`Organisation with code ${orgCode} not recognised.`)
      }

      try {
        const officeLocationMap = await request.server.methods.db.getStandardisedOfficeLocationMap()
        const users = await convertCSVToJSON(fileStream, organisation, officeLocationMap)
        const { nonValid, valid } = validateUsers(users)

        if (nonValid.length > 0) {
          const errors = { file: `${nonValid.length} record(s) are not valid.` }
          return h.view(routeId, new Model({ headers: orgDataFileHeaders, organisations }, errors))
        }

        if (valid.length === 0) {
          const errors = { file: 'No valid records found. No upload will take place.' }
          return h.view(routeId, new Model({ headers: orgDataFileHeaders, organisations }, errors))
        }

        if (anyDuplicates(valid)) {
          const errors = { file: 'Duplicates found. No upload will take place.' }
          return h.view(routeId, new Model({ headers: orgDataFileHeaders, organisations }, errors))
        }

        const uploadRes = await uploadUserData(valid, orgCode)
        if (!uploadRes) {
          return boom.internal(`Problem uploading user data for file ${filename}.`)
        }

        return h.view('org-data-upload-results', new Model({ filename, organisation, recordCount: valid.length }))
      } catch (err) {
        return boom.internal(`Problem uploading user data for file ${filename}.`, err)
      }
    },
    options: {
      auth,
      payload: {
        maxBytes: 1024 * 1024 * 8, // 8MB limit
        output: 'stream',
        multipart: true
      },
      validate: {
        payload: Joi.object().keys({
          file: Joi.object().required(),
          orgCode: Joi.string().required()
        }),
        failAction: async (request, h, err) => {
          const { orgCode } = request.payload
          const orgList = await request.server.methods.db.getOrganisationList()
          const organisations = generateNonCoreOrgSelectItems(orgList, orgCode)
          const errors = getMappedErrors(err, errorMessages)

          return h.view(routeId, new Model({ headers: orgDataFileHeaders, organisations }, errors)).takeover()
        }
      }
    }
  }
]
