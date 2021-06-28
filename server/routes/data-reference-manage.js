const boom = require('@hapi/boom')
const Joi = require('joi')

const { scopes } = require('../permissions')
const BaseModel = require('../lib/model')
const convertReferenceDataCsvToJson = require('../lib/convert-reference-data-csv-to-json')
const { types, typeInfo } = require('../lib/reference-data')
const updateReferenceData = require('../lib/update-reference-data')

const errorMessages = {
  file: { '*': 'Select a valid CSV file' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const path = '/data-reference-manage/{type}'

async function dropItemFromServerCache (request, type) {
  switch (type) {
    case types.officeLocations:
      return Promise.all([
        request.server.methods.db.getAreaToOfficeMap.cache.drop(),
        request.server.methods.db.getStandardisedOfficeLocationMap.cache.drop()])
    case types.orgList:
      return request.server.methods.db.getOrganisationList.cache.drop()
  }
}

module.exports = [
  {
    method: 'GET',
    path,
    handler: (request, h) => {
      const { type } = request.params
      return h.view('data-reference-manage', new Model(typeInfo[type]))
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
  }, {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { type } = request.params
      const { file: fileStream } = request.payload
      const { filename, headers } = fileStream.hapi

      if (!filename || headers['content-type'] !== 'text/csv') {
        const errors = { file: errorMessages.file['*'] }
        return h.view('data-reference-manage', new Model(typeInfo[type], errors))
      }

      // TODO: Convert CSV to JSON and upload
      try {
        const data = await convertReferenceDataCsvToJson(fileStream, type)

        // TODO: Might need to validate reference data prior to uploading
        // TODO: Need to make sure not all columns are used for data
        // TODO: Need to generate (and upload) the areaToOfficeMap file for `officeLocations`

        const updateRes = await updateReferenceData(data, type)
        if (updateRes.statusCode !== 200) {
          return boom.internal(`Problem uploading ${types[type]} reference data for file ${filename}.`, updateRes)
        }
      } catch (err) {
        return boom.internal(`Problem uploading ${types[type]} reference data for file ${filename}.`, err)
      }

      await dropItemFromServerCache(request, type)
      // TODO: Potentially add some more info to view
      return h.view('data-reference-upload-results', new Model({ filename, heading: typeInfo[type].heading }))
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
        params: Joi.object().keys({
          type: Joi.string().valid(types.officeLocations, types.orgList, types.orgMap).required()
        }),
        payload: Joi.object().keys({
          file: Joi.object().required()
        })
      }
    }
  }
]
