const path = require('path')
const nunjucks = require('nunjucks')
const config = require('../config')
const pkg = require('../../package.json')
const serviceName = 'Group wide alert'

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
    isCached: !config.isLocal,
    context: {
      appVersion: pkg.version,
      assetPath: '/assets',
      serviceName: serviceName,
      pageTitle: `${serviceName}`,
      phaseBannerTag: config.phaseBannerTag,
      phaseBannerHtml: config.phaseBannerHtml
    }
  }
}
