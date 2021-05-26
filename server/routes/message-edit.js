const boom = require('@hapi/boom')
const Joi = require('joi')

const BaseModel = require('../lib/model')
const { updateMessage, getAllGroups, getMessage } = require('../lib/db')
const { getMappedErrors } = require('../lib/errors')
const { textMessages: { maxMsgLength } } = require('../constants')

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

const routeId = 'message-edit'
const path = `/${routeId}/{messageId}`

module.exports = [
  {
    method: 'GET',
    path,
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

      return h.view(routeId, new Model({
        ...message,
        has_info: !!message.info,
        maxMsgLength,
        items
      }))
    },
    options: {
      validate: {
        params: Joi.object().keys({
          messageId: Joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path,
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
        params: Joi.object().keys({
          messageId: Joi.number().integer().required()
        }),
        payload: Joi.object().keys({
          groupId: Joi.number().integer().required(),
          text: Joi.string().max(maxMsgLength).empty('').when('info', {
            is: Joi.exist(),
            otherwise: Joi.required()
          }),
          info: Joi.string().max(2000).allow('').empty('')
        }),
        failAction: async (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          const { groupId } = request.payload
          const items = await getSelectItems(+groupId)

          return h.view('create-message', new Model({
            ...request.payload,
            items,
            maxMsgLength
          }, errors)).takeover()
        }
      }
    }
  }
]
