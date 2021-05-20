const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const BaseModel = require('../lib/model')
const { updateMessage, getAllGroups, getMessage } = require('../lib/db')
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
    path: '/message/{messageId}/edit',
    handler: async (request, h) => {
      const { messageId } = request.params
      const message = await getMessage(messageId)

      if (!message) {
        return boom.notFound()
      }

      if (message.sent_at) {
        return h.redirect(`/message/${message.id}`)
      }

      const items = await getSelectItems(message.group_id)

      return h.view('edit-message', new Model({
        ...message,
        has_info: !!message.info,
        MAX_MESSAGE_TEXT_LENGTH,
        items
      }))
    },
    options: {
      validate: {
        params: joi.object().keys({
          messageId: joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/message/{messageId}/edit',
    handler: async (request, h) => {
      const { messageId } = request.params
      const { credentials } = request.auth
      const {
        groupId,
        text,
        info
      } = request.payload

      await updateMessage(credentials.user.id, messageId, groupId, text, info)

      return h.redirect(`/message/${messageId}`)
    },
    options: {
      validate: {
        params: joi.object().keys({
          messageId: joi.number().integer().required()
        }),
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
