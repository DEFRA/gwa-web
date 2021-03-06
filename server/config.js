require('dotenv').config()
const Joi = require('joi')
const envs = ['local', 'development', 'test', 'production']

const schema = Joi.object().keys({
  aadClientId: Joi.string().guid(),
  aadClientSecret: Joi.string().required(),
  aadTenantId: Joi.string().guid(),
  contactListContainer: Joi.string().default('contact-list'),
  contactListStorageConnectionString: Joi.string().required(),
  dataExtractContainer: Joi.string().default('data-extract'),
  dataExtractStorageConnectionString: Joi.string().required(),
  dataSourcesContainer: Joi.string().default('data-sources'),
  dataSourcesStorageConnectionString: Joi.string().required(),
  db: Joi.object().keys({
    connectionString: Joi.string().required(),
    messagesContainerName: Joi.string().default('messages'),
    name: Joi.string().required(),
    receiptsContainerName: Joi.string().default('receipts'),
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
  notifyDashboardUri: Joi.string().uri(),
  phaseBannerHtml: Joi.string().required(),
  phaseBannerTag: Joi.string().required(),
  phoneNumbersContainer: Joi.string().default('phone-numbers'),
  phoneNumbersStorageConnectionString: Joi.string().required(),
  siteUri: Joi.string().uri()
})

const config = {
  aadClientId: process.env.AAD_CLIENT_ID,
  aadClientSecret: process.env.AAD_CLIENT_SECRET,
  aadTenantId: process.env.AAD_TENANT_ID,
  contactListContainer: process.env.CONTACT_LIST_CONTAINER,
  contactListStorageConnectionString: process.env.CONTACT_LIST_STORAGE_CONNECTION_STRING,
  dataExtractContainer: process.env.DATA_EXTRACT_CONTAINER,
  dataExtractStorageConnectionString: process.env.DATA_EXTRACT_STORAGE_CONNECTION_STRING,
  dataSourcesContainer: process.env.DATA_SOURCES_CONTAINER,
  dataSourcesStorageConnectionString: process.env.DATA_SOURCES_STORAGE_CONNECTION_STRING,
  db: {
    connectionString: process.env.COSMOS_DB_CONNECTION_STRING,
    messagesContainerName: process.env.COSMOS_DB_MESSAGES_CONTAINER,
    name: process.env.COSMOS_DB_NAME,
    receiptsContainerName: process.env.COSMOS_DB_RECEIPTS_CONTAINER,
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
  notifyDashboardUri: process.env.NOTIFY_DASHBOARD_URI,
  isLocal: process.env.NODE_ENV === 'local',
  phaseBannerHtml: process.env.PHASE_BANNER_HTML,
  phaseBannerTag: process.env.PHASE_BANNER_TAG,
  phoneNumbersContainer: process.env.PHONE_NUMBERS_CONTAINER,
  phoneNumbersStorageConnectionString: process.env.PHONE_NUMBERS_STORAGE_CONNECTION_STRING,
  siteUri: process.env.SITE_URI
}

const { error, value } = schema.validate(config)

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

module.exports = value
