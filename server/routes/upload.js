const boom = require('@hapi/boom')
const Joi = require('@hapi/joi')

const BaseModel = require('../lib/model')
const { getMappedErrors } = require('../lib/errors')
const { scopes } = require('../permissions')

const errorMessages = {
  file: {
    '*': 'Select a valid CSV file',
    'array.min': 'CSV file is empty'
  }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/upload',
    handler: async (request, h) => {
      return h.view('upload')
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.system.maintain}`]
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/upload',
    handler: async (request, h) => {
      const { payload } = request
      const { file: fileStream } = payload

      try {
        await new Promise((resolve, reject) => {
          fileStream.on('error', reject)
        })

        return h.view('upload-results')
      } catch (err) {
        return boom.badRequest('Upload failed', err)
      }
    },
    options: {
      auth: {
        access: {
          scope: [`+${scopes.system.maintain}`]
        }
      },
      payload: {
        maxBytes: 1024 * 1024 * 8, // 8MB limit
        output: 'stream',
        multipart: true
      },
      validate: {
        payload: Joi.object().keys({
          file: Joi.object().required()
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view('upload', new Model({}, errors)).takeover()
        }
      }
    }
  }
]
