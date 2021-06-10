const boom = require('@hapi/boom')
const Joi = require('@hapi/joi')

const { scopes } = require('../permissions')
const { getMappedErrors } = require('../lib/errors')
const BaseModel = require('../lib/model')
const uploadUserData = require('../lib/upload-user-data')
const convertCSVToJSON = require('../lib/convert-csv-to-json')

const errorMessages = {
  file: { '*': 'Select a valid CSV file' },
  orgCode: { '*': 'Select an organisation' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

/**
 * Generates the items for use in a [GOV.UK
 * select](https://design-system.service.gov.uk/components/select/) component.
 * Specifically, the non-core organisations.
 *
 * @param {Array} organisations list of organisations with `core` (flag indicating
 * exclusion), `active` (flag indicating if the org should be listed) `orgCode`
 * and `orgName`.
 * @param {string} [selected=''] the item to set as selected, defaults to
 * 'Select an organisation' option..
 * @returns {Array} `items` for GOV.UK select.
 */
function generateNonCoreOrgSelectItems (organisations, selected = '') {
  // TODO: extract to own module
  const nonCoreOrganisations = organisations.filter(org => !org.core && org.active).map(org => { return { text: org.orgName, value: org.orgCode, selected: org.orgCode === selected } })
  nonCoreOrganisations.unshift({ text: 'Select an organisation', selected: selected === '' })
  return nonCoreOrganisations
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

      try {
        const data = await convertCSVToJSON(fileStream)
        console.log('DATA', data)
        if (!data) {
          const errors = { file: errorMessages.file['*'] }
          return h.view('upload', new Model({ organisations }, errors))
        }

        const uploadRes = await uploadUserData(data, orgCode)
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
