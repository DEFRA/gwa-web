const path = require('path')
const nunjucks = require('nunjucks')
const { isLocal, phaseBannerHtml, phaseBannerTag } = require('../config')
const { serviceName } = require('../constants')
const { version } = require('../../package.json')

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      html: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          options.compileOptions.environment = nunjucks.configure([
            path.join(options.relativeTo || process.cwd(), options.path),
            'node_modules/govuk-frontend/'
          ], {
            autoescape: true,
            watch: false
          })

          return next()
        }
      }
    },
    path: '../views',
    relativeTo: __dirname,
    isCached: !isLocal,
    context: {
      appVersion: version,
      assetPath: '/assets',
      pageTitle: serviceName,
      phaseBannerHtml,
      phaseBannerTag,
      serviceName
    }
  }
}
