const boom = require('@hapi/boom')
const { v4: uuid } = require('uuid')

const { errorMessages, textMessages: { maxMessageLength }, messageStates } = require('../constants')
const upsertMessage = require('../lib/messages/upsert-message')
const BaseModel = require('../lib/misc/model')
const { message: { failAction } } = require('../lib/route/fail-actions')
const { message: { payload } } = require('../lib/route/validations')
const generateOfficeCheckboxes = require('../lib/view/office-checkboxes')
const generateOrganisationCheckboxes = require('../lib/view/organisation-checkboxes')
const sendToAllRadios = require('../lib/view/send-to-all-radios')
const { scopes } = require('../permissions')

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
      const allOfficeRadios = sendToAllRadios()
      const allOrgRadios = sendToAllRadios()

      return h.view(routeId, new Model({ allOfficeRadios, allOrgRadios, maxMessageLength, officeCheckboxes, orgCheckboxes }))
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
      const { allOffices, allOrgs, info, officeCodes, orgCodes, text } = request.payload

      const message = {
        allOffices,
        allOrgs,
        id: uuid(),
        info: info?.trim(),
        officeCodes: [officeCodes ?? []].flat(),
        orgCodes: [orgCodes].flat(),
        text: text?.trim(),
        state: messageStates.created
      }
      const res = await upsertMessage(message, user)
      if (res.statusCode !== 201) {
        return boom.internal('Problem creating message.', res)
      }

      return h.redirect(`/message-view/${message.id}`)
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
