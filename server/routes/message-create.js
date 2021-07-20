const boom = require('@hapi/boom')
const { v4: uuid } = require('uuid')

const { errorMessages, textMessages: { maxMessageLength }, messageStates } = require('../constants')
const { scopes } = require('../permissions')
const { saveMessage } = require('../lib/db')
const addAuditEvent = require('../lib/messages/add-audit-event')
const BaseModel = require('../lib/misc/model')
const { message: { failAction } } = require('../lib/route/route-fail-actions')
const { message: { payload } } = require('../lib/route/route-validations')
const generateOfficeCheckboxes = require('../lib/view/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/view/organisation-checkboxes')
const generateSendToAllOrgsRadios = require('../lib/view/send-to-all-radios')

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
      const [areaToOfficeMap, organisationList, notifyStatus] = await Promise.all([
        request.server.methods.db.getAreaToOfficeMap(),
        request.server.methods.db.getOrganisationList(),
        request.server.methods.getNotifyStatusViewData()
      ])
      const officeCheckboxes = generateOfficeCheckboxes(areaToOfficeMap)
      const orgCheckboxes = generateOrganisationCheckboxes(organisationList)
      const allOfficeRadios = generateSendToAllOrgsRadios()

      return h.view(routeId, new Model({ allOfficeRadios, maxMessageLength, notifyStatus, officeCheckboxes, orgCheckboxes }))
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
        info: info?.trim(),
        officeCodes: [officeCodes ?? []].flat(),
        orgCodes: [orgCodes].flat(),
        text: text?.trim(),
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
