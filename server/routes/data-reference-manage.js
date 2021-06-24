// const boom = require('@hapi/boom')
const Joi = require('joi')

const { scopes } = require('../permissions')
const BaseModel = require('../lib/model')
const { types, typeInfo } = require('../lib/reference-data')

const errorMessages = {
  file: { '*': 'Select a valid CSV file' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const path = '/data-reference-manage/{type}'

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
    handler: (request, h) => {
      console.log('POST to', path)
      const { type } = request.params
      // TODO: convert CSV to JSON and upload
      return h.view('data-reference-manage', new Model(typeInfo[type]))
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
