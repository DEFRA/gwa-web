const joi = require('@hapi/joi')
const BaseModel = require('../lib/model')
const { insertMessage, getAllGroups } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')
const { MAX_MESSAGE_TEXT_LENGTH } = require('../constants')

const errorMessages = {
  groupId: 'Select a group',
  text: 'Enter the text message',
  info: 'Enter the additional information'
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

async function getSelectItems (selectedGroup) {
  const groups = await getAllGroups()

  return [{}].concat(groups.map(group => ({
    text: `${group.name} (${group.code})`,
    value: group.id,
    selected: group.id === selectedGroup
  })))
}

module.exports = [
  {
    method: 'GET',
    path: '/create-message',
    handler: async (request, h) => {
      const items = await getSelectItems()
      return h.view('create-message', new Model({ items, MAX_MESSAGE_TEXT_LENGTH }))
    }
  },
  {
    method: 'POST',
    path: '/create-message',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const {
        groupId,
        text,
        info
      } = request.payload

      await insertMessage(credentials.user.id, groupId, text, info)

      return h.redirect('/messages')
    },
    options: {
      validate: {
        payload: joi.object().keys({
          groupId: joi.number().integer().required(),
          text: joi.string().max(MAX_MESSAGE_TEXT_LENGTH).empty('').when('info', {
            is: joi.exist(),
            otherwise: joi.required()
          }),
          info: joi.string().max(2000).allow('').empty('')
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          const { groupId } = request.payload
          const items = await getSelectItems(+groupId)

          return h.view('create-message', new Model({
            ...request.payload,
            items,
            MAX_MESSAGE_TEXT_LENGTH
          }, errors)).takeover()
        }
      }
    }
  }
]
