const boom = require('@hapi/boom')
const Joi = require('joi')

const { scopes } = require('../permissions')
const BaseModel = require('../lib/misc/model')
const convertReferenceDataCsvToJson = require('../lib/data/convert-reference-data-csv-to-json')
const { types, typeInfo } = require('../lib/view/reference-data')
const triggerImport = require('../lib/data/trigger-import')
const updateReferenceData = require('../lib/data/update-reference-data')

const errorMessages = {
  file: {
    '*': 'Select a valid CSV file',
    validity: 'Reference data was not valid.'
  }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const auth = { access: { scope: [`+${scopes.data.manage}`] } }

const path = '/data-reference-manage/{type}'

async function postDataUpdateActions (request, type) {
  switch (type) {
    case types.officeLocations:
      return Promise.all([
        request.server.methods.db.getAreaToOfficeMap.cache.drop(),
        request.server.methods.db.getStandardisedOfficeLocationMap.cache.drop()
      ])
    case types.orgList:
      return Promise.all([
        request.server.methods.db.getOrganisationList.cache.drop(),
        triggerImport()
      ])
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
      auth,
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
      const { filename } = fileStream.hapi

      if (!filename || !filename.endsWith('.csv')) {
        const errors = { file: errorMessages.file['*'] }
        return h.view('data-reference-manage', new Model(typeInfo[type], errors))
      }

      try {
        const { data, valid } = await convertReferenceDataCsvToJson(fileStream, type, request.server.methods.db)
        if (!valid) {
          const errors = { file: errorMessages.file.validity }
          return h.view('data-reference-manage', new Model(typeInfo[type], errors))
        }

        const updateRes = await updateReferenceData(data, type)
        if (updateRes.statusCode !== 200) {
          return boom.internal(`Problem uploading ${types[type]} reference data for file ${filename}.`, updateRes)
        }
      } catch (err) {
        return boom.internal(`Problem uploading ${types[type]} reference data for file ${filename}.`, err)
      }

      await postDataUpdateActions(request, type)
      return h.view('data-reference-upload-results', new Model({ filename, heading: typeInfo[type].heading }))
    },
    options: {
      auth,
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
