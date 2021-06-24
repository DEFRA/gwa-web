const boom = require('@hapi/boom')
const { v4: uuid } = require('uuid')

const { textMessages: { maxMessageLength }, messageStates } = require('../constants')
const { scopes } = require('../permissions')
const addAuditEvent = require('../lib/add-audit-event')
const { message: errorMessages } = require('../lib/error-messages')
const { saveMessage } = require('../lib/db')
const generateOfficeCheckboxes = require('../lib/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/organisation-checkboxes')
const BaseModel = require('../lib/model')
const { message: { failAction } } = require('../lib/route-fail-actions')
const { message: { payload } } = require('../lib/route-validations')
const generateSendToAllOrgsRadios = require('../lib/send-to-all-radios')

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

const auth = { access: { scope: [`+${scopes.message.manage}`] } }
const routeId = 'message-create'
const path = `/${routeId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: async (request, h) => {
      const [areaToOfficeMap, organisationList] = await Promise.all([
        request.server.methods.db.getAreaToOfficeMap(),
        request.server.methods.db.getOrganisationList()
      ])
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList)
      const allOfficeRadios = generateSendToAllOrgsRadios()

      return h.view(routeId, new Model({ allOfficeRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }))
    },
    options: {
      auth
    }
  },
  {
    method: 'POST',
    path,
    handler: async (request, h) => {
      const { user } = request.auth.credentials
      const { allOffices, info, officeCodes, orgCodes, text } = request.payload

      const message = {
        allOffices,
        id: uuid(),
        info,
        officeCodes: [officeCodes ?? []].flat(),
        orgCodes: [orgCodes].flat(),
        text,
        state: messageStates.created
      }
      addAuditEvent(message, user)
      const res = await saveMessage(message)
      if (res.statusCode !== 201) {
        return boom.internal('Problem creating message.', res)
      }

      return h.redirect('/messages')
    },
    options: {
      auth,
      validate: {
        payload,
        failAction: async (request, h, err) => {
          return failAction(request, h, err, routeId)
        }
      }
    }
  }
]
