# GWA Web

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)\
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=coverage)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=sqale_index)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)\
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=security_rating)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_gwa-web&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=DEFRA_gwa-web)
[![Known Vulnerabilities](https://snyk.io/test/github/defra/gwa-web/badge.svg)](https://snyk.io/test/github/defra/gwa-web)

> Web app for sending messages, managing data and administering users for group
> wide alerts.

The web app contains functionality to:

* create and send messages to groups of people
* manage data used within the system
* administer phone numbers and the groups they are subscribed to

There are three roles within the app:

* User
* DataManager
* Administrator

All users are a `User`. A user can login to the application if they have an
active account within the Defra Azure Active Directory (AAD). Although the
login mechanism will work, for the user to be able to access their account they
must also have an active record within the application's DB. More information
is available [here](#user-data).

`DataManager` and `Administrator` require the user to belong to an AAD group
that has been setup to map to the roles. More information is available
[here](#user-roles).

Broadly speaking, a DataManager can perform data related actions such as
managing the reference data, uploading new organisation data.

An Administrator can do everything a DataManager can and in addition has access
to the message creation, editing and sending functionality.

## Running the application

The are a number of prerequisites required for the application to be
usable, see [prerequisites](#prerequisites).

Once the prerequisites are completed, install the dependencies (`npm install`)
and generate the CSS (`npm run build`).

This will build the application's sass assets including those from
[`govuk-frontend`](https://www.npmjs.com/package/govuk-frontend).

The application should now be ready to run with `npm run start`. Check the
server is running by pointing your browser to
[localhost:3000](http://localhost:3000).

Running `npm run start:watch` will start the application using
[nodemon](https://www.npmjs.com/package/nodemon) which is useful when making
changes to the application.

### Prerequisites

The application requires the following:

* Access to a
  [Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/introduction)
  account
* An Azure Active Directory application, created via the
  [registration process](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
* Access to
  [Azure Storage](https://docs.microsoft.com/en-us/azure/storage/common/storage-introduction).
  This could be an actual account or
  [Azurite](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azurite),
  a storage emulator

An example `.env` file exists in the root directory -
[.env.example](.env.example). Once the prerequisites are complete, create a
copy of the file and rename it to `.env`, then add the appropriate values to
the variables.

#### Reference data

There are a number of reference data items used within the application. Each
item should be available within the DB, in the `reference-data` container. The
best source of the data is to get a copy of it from an already running system
as the data changes overtime. Failing that, the initial data files are
available within the infrastructure repository. The items required are:

* `areaToOfficeMap`
* `organisationList`
* `organisatioMap`
* `standardisedOfficeLocationMap`

#### User data

Ideally, the DB will be populated with data from the ETL functions, however,
all that is needed for a user to be able to login is to have a record in the
`users` container that is active. The easiest way to create the record is to
fill out the placeholder below and add it to the container via the portal.

```json
{
  "givenName": "givenName",
  "surname": "surname",
  "officeLocation": "Unknown",
  "officeCode": "UNK:Unknown",
  "orgCode": "DEFRA",
  "orgName": "Department for Environment, Food and Rural Affairs",
  "phoneNumbers": [ ],
  "active": true,
  "id": "givenName.surname@org.gov.uk",
}
```

#### User roles

By default a user has a role of `User`. In order for a user to have the
additional roles of `Administrator` and `DataManager` they must be configured
in AAD. In the non-development versions of the application an AAD group is
mapped to the role, however, this is not strictly necessary and is done for
ease of administration. When working with a development AAD app
registration it is easier to map a user directly to the role.
The creation of roles in the AAD app and how to assign users to roles is
covered in Azure documentation found
[here](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-add-app-roles-in-azure-ad-apps).

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
