const boom = require('@hapi/boom')
const Joi = require('joi')

const { scopes } = require('../permissions')
const BaseModel = require('../lib/model')

const errorMessages = {
  file: { '*': 'Select a valid CSV file' }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}
const dataTypeKeys = {
  officeLocations: 'office-locations',
  orgList: 'org-list',
  orgMap: 'org-map'
}

const dataTypes = {
  [dataTypeKeys.officeLocations]: {
    download: 'office-locations-reference-data.csv',
    filename: 'office-locations',
    heading: 'Manage office locations reference data'
  },
  [dataTypeKeys.orgList]: {
    download: 'organisation-list-reference-data.csv',
    filename: 'org-list',
    heading: 'Manage organisation list reference data'
  },
  [dataTypeKeys.orgMap]: {
    download: 'organisation-map-reference-data.csv',
    filename: 'org-map',
    heading: 'Manage organisation map reference data'
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/data-reference-manage/{type}',
    handler: (request, h) => {
      console.log('hi')
      console.log(request.params)
      const { type } = request.params
      return h.view('data-reference-manage', new Model(dataTypes[type]))
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.data.manage}`]
        }
      },
      validate: {
        params: Joi.object().keys({
          type: Joi.string().valid(dataTypeKeys.officeLocations, dataTypeKeys.orgList, dataTypeKeys.orgMap).required()
        })
      }
    }
  }
]
