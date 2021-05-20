const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const copyFrom = require('pg-copy-streams').from
const BaseModel = require('../lib/model')
const { scopes } = require('../permissions')
const { getMappedErrors } = require('../lib/errors')
const { pool } = require('../db')

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

const copyUploadSql = `COPY staff_alerts.upload(
  id, first_name, last_name, email, organisation,
  active, office, department, managerid, mobile
) FROM STDIN WITH (FORMAT CSV, HEADER TRUE);`

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

      const client = await pool.connect()
      await client.query('TRUNCATE table staff_alerts.upload RESTART IDENTITY;')

      const copySql = copyUploadSql
      const pgStream = client.query(copyFrom(copySql))

      try {
        await new Promise((resolve, reject) => {
          fileStream.on('error', reject)
          pgStream.on('error', reject)

          pgStream.on('finish', async () => {
            // This query merges the upload data into the `user` and `contact` tables
            await client.query('CALL staff_alerts.merge_upload()')

            client.release(true)

            resolve()
          })

          fileStream.pipe(pgStream)
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
        payload: joi.object().keys({
          file: joi.object().required()
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view('upload', new Model({}, errors)).takeover()
        }
      }
    }
  }
]
