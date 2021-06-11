const boom = require('@hapi/boom')
const Joi = require('@hapi/joi')

const { scopes } = require('../permissions')
const convertCSVToJSON = require('../lib/convert-users-csv-to-json')
const { getStandardisedOfficeLocationMap } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')
const BaseModel = require('../lib/model')
const generateNonCoreOrgSelectItems = require('../lib/non-core-org-select')
const uploadUserData = require('../lib/upload-user-data')

const errorMessages = {
  file: { '*': 'Select a valid CSV file' },
  orgCode: { '*': 'Select an organisation' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const path = '/upload'

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const orgList = await request.server.methods.db.getOrganisationList()
      const organisations = generateNonCoreOrgSelectItems(orgList)

      return h.view('upload', new Model({ organisations }))
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.data.manage}`]
        }
      }
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { file: fileStream, orgCode } = request.payload
      const { filename, headers } = fileStream.hapi
      const orgList = await request.server.methods.db.getOrganisationList()
      const organisations = generateNonCoreOrgSelectItems(orgList, orgCode)

      if (!filename || headers['content-type'] !== 'text/csv') {
        const errors = { file: errorMessages.file['*'] }
        return h.view('upload', new Model({ organisations }, errors))
      }

      const organisation = orgList.filter(o => o.orgCode === orgCode)[0]
      if (!organisation) {
        return boom.badRequest(`Organisation with code ${orgCode} not recognised`)
      }

      try {
        const officeLocationMap = await getStandardisedOfficeLocationMap()
        const { errors: errorUsers, users } = await convertCSVToJSON(fileStream, organisation, officeLocationMap)
        // TODO: Validate users, return view with error when invalid format
        console.log('DATA', users, errorUsers)
        if (errorUsers) {
          const errors = { file: errorMessages.file['*'] }
          return h.view('upload', new Model({ organisations }, errors))
        }

        const uploadRes = await uploadUserData(users, orgCode)
        if (!uploadRes) {
          return boom.internal(`Problem uploading user data for file ${filename}.`)
        }

        return h.view('upload-results', new Model({ filename }))
      } catch (err) {
        return boom.internal(`Problem uploading user data for file ${filename}.`, err)
      }
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.data.manage}`]
        }
      },
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

          return h.view('upload', new Model({ organisations }, errors)).takeover()
        }
      }
    }
  }
]
