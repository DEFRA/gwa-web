const envVars = require('./test/test-env-vars')

process.env.AAD_TENANT_ID = envVars.aadTenantId
process.env.AAD_CLIENT_ID = envVars.aadClientId
process.env.AAD_CLIENT_SECRET = envVars.aadClientSecret
process.env.CONTACT_LIST_CONTAINER = envVars.contactListContainer
process.env.CONTACT_LIST_STORAGE_CONNECTION_STRING = envVars.contactListStorageConnectionString
process.env.DATA_SOURCES_CONTAINER = envVars.dataSourcesContainer
process.env.DATA_SOURCES_STORAGE_CONNECTION_STRING = envVars.dataSourcesStorageConnectionString
process.env.COSMOS_DB_CONNECTION_STRING = envVars.cosmosDBConnectionString
process.env.COSMOS_DB_NAME = envVars.cosmosDBName
process.env.COOKIE_IS_SECURE = envVars.cookieIsSecure
process.env.COOKIE_PASSWORD = envVars.cookiePassword
process.env.FORCE_HTTPS = envVars.forceHttps
process.env.LOGOUT_REDIRECT_URI = envVars.logoutRedirectUri
process.env.PHASE_BANNER_HTML = envVars.phaseBannerHtml
process.env.PHASE_BANNER_TAG = envVars.phaseBannerTag
