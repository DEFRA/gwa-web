# GWA Web

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)\
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=coverage)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=sqale_index)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)\
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=security_rating)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Known Vulnerabilities](https://snyk.io/test/github/defra/gwa-web/badge.svg)](https://snyk.io/test/github/defra/gwa-web)

> Web app for sending messages and administering users for group wide alerts.

The web contains functionality for both the creation and initiation of the
sending of messages to groups of people and the ability for users to login and
add additional phone numbers to their profile.

## Running the application

First install the dependencies and build the application using:

```cmd
npm i
npm run build
```

Currently this will just build the `govuk-frontend` sass but may be extended to include other build tasks as needed (e.g. client-side js using browserify or webpack etc.)

Now the application is ready to run:

`npm run start`

Check the server is running by pointing your browser to
[http://localhost:3000](http://localhost:3000).

## Config - TODO (update)

The configuration file for the server is found at `server/config.js`.
This is where to put any config and all config should be read from the environment.
The final config object should be validated using joi and the application should not start otherwise.

## Plugins - TODO (update)

hapi has a powerful plugin system and all server code should be loaded in a plugin.

Plugins live in the `server/plugins` directory.

## Logging - TODO (update)

The [hapi-pino](https://github.com/pinojs/hapi-pino) plugin is included and configured in `server/plugins/logging`

## Views - TODO (update)

The [vison](https://github.com/hapijs/vision) plugin is used for template rendering support.

The template engine used in nunjucks inline with the GDS Design System with support for view caching, layouts, partials and helpers.

## Static files - TODO (update)

The [Inert](https://github.com/hapijs/inert) plugin is used for static file and directory handling in hapi.js.
Put all static assets in `server/public/static`.

Any build output should write to `server/public/build`. This path is in the `.gitignore` and is therefore not checked into source control.

## Routes - TODO (update)

Incoming requests are handled by the server via routes.
Each route describes an HTTP endpoint with a path, method, and other properties.

Routes are found in the `server/routes` directory and loaded using the `server/plugins/router.js` plugin.

Hapi supports registering routes individually or in a batch.
Each route file can therefore export a single route object or an array of route objects.

A single route looks like this:

```js
{
  method: 'GET',
  path: '/hello-world',
  options: {
    handler: (request, h) => {
      return 'hello world'
    }
  }
}
```

There are lots of [route options](http://hapijs.com/api#route-options), here's the documentation on [hapi routes](http://hapijs.com/tutorials/routing)

## Tasks - TODO (update)

Build tasks are created using simple shell scripts or node.js programs.
The default ones are found in the `bin` directory.

The task runner is simply `npm` using `npm-scripts`.

We chose to use this for simplicity but there's nothing to stop you adding `gulp`, `grunt` or another task runner if you prefer.

The predefined tasks are:

- `npm run build` (Runs all build sub-tasks)
- `npm run build:css` (Builds the client-side sass)
- `npm run lint` (Runs the lint task using standard.js)
- `npm run unit-test` (Runs the `lab` tests in the `/test` folder)
- `npm test` (Runs the `lint` task then the `unit-tests`)

### Resources - TODO (update)

For more information around using `npm-scripts` as a build tool:

- http://substack.net/task_automation_with_npm_run
- http://ponyfoo.com/articles/choose-grunt-gulp-or-npm
- http://blog.keithcirkel.co.uk/why-we-should-stop-using-grunt/
- http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/

## Testing - TODO (update)

[lab](https://github.com/hapijs/lab) and [code](https://github.com/hapijs/code) are used for unit testing.

See the `/test` folder for more information.

## Linting - TODO (update)

[standard.js](http://standardjs.com/) is used to lint both the server-side and client-side javascript code.

It's defined as a build task and can be run using `npm run lint`.

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT
LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and
applications when using this information.

> Contains public sector information licensed under the Open Government license
> v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her
Majesty's Stationery Office (HMSO) to enable information providers in the
public sector to license the use and re-use of their information under a common
open licence.

It is designed to encourage use and re-use of information freely and flexibly,
with only a few conditions.
