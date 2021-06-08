const envVars = require('./test/test-env-vars')

process.env.AAD_TENANT_ID = envVars.aadTenantId
process.env.LOGOUT_REDIRECT_URI = envVars.logoutRedirectUri
