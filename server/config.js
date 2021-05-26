require('dotenv').config()
const Joi = require('joi')
const envs = ['local', 'development', 'test', 'production']

const schema = Joi.object().keys({
  analyticsAccountId: Joi.string().optional(),
  aadClientId: Joi.string().guid(),
  aadClientSecret: Joi.string().required(),
  aadTenant: Joi.string().guid(),
  db: Joi.object().keys({
    connectionString: Joi.string().required(),
    name: Joi.string().required(),
    messagesContainerName: Joi.string().default('messages'),
    refDataContainerName: Joi.string().default('reference-data'),
    usersContainerName: Joi.string().default('users')
  }).required(),
  env: Joi.string().valid(...envs).required(),
  port: Joi.number().default(3000),
  cookie: Joi.object().keys({
    password: Joi.string().min(32).required(),
    isSecure: Joi.boolean().default(true)
  }).required(),
  isLocal: Joi.boolean().default(false),
  forceHttps: Joi.boolean().required(),
  logoutRedirectUri: Joi.string().uri(),
  // documentationHomePage: Joi.string().required(),
  // websiteHomePage: Joi.string().required(),
  maxPersonalPhoneNumbers: Joi.number().integer().default(2),
  phaseBannerTag: Joi.string().required(),
  phaseBannerHtml: Joi.string().required()
})

const config = {
  aadClientId: process.env.AAD_CLIENT_ID,
  aadClientSecret: process.env.AAD_CLIENT_SECRET,
  aadTenant: process.env.AAD_TENANT_ID,
  db: {
    connectionString: process.env.COSMOS_DB_CONNECTION_STRING,
    name: process.env.COSMOS_DB_NAME,
    messagesContainerName: process.env.COSMOS_DB_MESSAGES_CONTAINER,
    refDataContainerName: process.env.COSMOS_DB_REFDATA_CONTAINER,
    usersContainerName: process.env.COSMOS_DB_USERS_CONTAINER
  },
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  cookie: {
    password: process.env.COOKIE_PASSWORD,
    isSecure: process.env.COOKIE_IS_SECURE
  },
  forceHttps: process.env.FORCE_HTTPS,
  logoutRedirectUri: process.env.LOGOUT_REDIRECT_URI,
  isLocal: process.env.NODE_ENV === 'local',
  // documentationHomePage: Joi.string().required(),
  // websiteHomePage: Joi.string().required(),
  // TODO: change this
  phaseBannerTag: 'local',
  phaseBannerHtml: 'This is a TEST service - messages will not be sent'
}

const { error, value } = schema.validate(config)

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

module.exports = value
