const routeId = 'faqs'
const path = `/${routeId}`
const { siteUri } = require('../config')

module.exports = [
  {
    method: 'GET',
    path,
    handler: (request, h) => {
      const sections = [{
        heading: 'Communication Method',
        accordion: {
          id: 'faqs-communication-method',
          items: [{
            heading: { text: 'Why is SMS text messaging the preferred means of communication?' },
            content: {
              html: '<p>SMS text alerting provides the capability to issue a message of importance quickly without the reliance of the end recipient having access to Defra Group approved device or necessarily a smart phone. It therefore provides the most consistent means to disseminate information outside of the working environment or during times when normal operational facilities are impaired in some way.</p>'
            }
          }, {
            heading: { text: 'Does the Service support email?' },
            content: {
              html: '<p>Currently email messaging is not supported. The Service is only intended to issue SMS text Alerts.</p>'
            }
          }, {
            heading: { text: 'Who will be responsible for issuing any text messaging?' },
            content: {
              html: '<p>Defra\'s Internal Communications team will be responsible for the issuing of messages, supported by members of the Business Continuity Team.</p>'
            }
          }, {
            heading: { text: 'Is the Service formally approved to communicate to the group workforce?' },
            content: {
              html: '<p>Yes. A Data Protection Impact Assessment (DPIA) has been approved by the Data Protection Managers across the Defra group.</p>'
            }
          }, {
            heading: { text: 'Will messages always be sent to all users held within the system?' },
            content: {
              html: '<p>Generally in the case of a major business continuity or security event it is likely that an alert will be issued to all users with a registered mobile number. However, recipients can be selected based on any combination of organisation and area, dependent on the necessity to advise specific groups.</p>'
            }
          }]
        }
      }, {
        heading: 'System Usage',
        accordion: {
          id: 'faqs-system-usage',
          items: [{
            heading: { text: 'How do I log on to the system?' },
            content: {
              html: '<ul>' +
                      `<li>Access to the system is via the following URL <a href="${siteUri}">${siteUri}</a></li>` +
                      '<li>You will be identified through Active Directory Authentication on your Defra approved-device and therefore will not require a user ID or password.</li>' +
                      '<li>It is recommended that you add the above URL to your favourites within your browser or create a shortcut on your device desktop.</li>' +
                    '</ul>'
            }
          }, {
            heading: { text: 'Can I access the Service to make amendments to my preferences on my own personal device?' },
            content: {
              html: '<p>No. The service is specifically designed from a security perspective to identify you and provide access through a Defra-provided or -approved device. Personal devices will not recognise your credentials and therefore prevent access to the system.</p>'
            }
          }, {
            heading: { text: 'Can I opt out of receiving messages?' },
            content: {
              html: '<p>There is no opt-out arrangement for anyone who has a company-provided mobile phone, as the system is primarily designed to protect our organisations and our people. If you have registered a personal mobile phone number, you have the option to remove that number and/or the area preferences registered against it.</p>'
            }
          }, {
            heading: { text: 'Are there any limits to how many personal phone numbers that can be registered?' },
            content: {
              html: '<p>Each user is limited to one personal mobile phone number.</p>'
            }
          }, {
            heading: { text: 'Can I remove or amend my personal number entered?' },
            content: {
              html: '<p>Yes, you are able to replace or remove the personal number you have registered as well as amending or removing any area preferences previously set up.</p>'
            }
          }, {
            heading: { text: 'Can I remove my company mobile phone number from the system?' },
            content: {
              html: '<p>No, all work mobile numbers are automatically subscribed to the service, as it is primarily designed to protect our organisations and our people. Only additional personal numbers registered can be removed from the system.</p>'
            }
          }, {
            heading: { text: 'Can I change my base geographical location, or organisation details if they are incorrect?' },
            content: {
              html: '<p>You are not able to amend these directly with the service, as it runs off your Active Directory information. Any required amendments to your personal data should be directed to your HR representative or line manager.</p>'
            }
          }, {
            heading: { text: 'How many additional locations can I subscribe to?' },
            content: {
              html: '<p>As many as you would like to – there are no upper restrictions.</p>'
            }
          }, {
            heading: { text: 'Can I amend my geographical area choices?' },
            content: {
              html: '<ul>' +
                      '<li>You cannot amend your default official base work location, as this stems from your Active Director information and is fixed. However, you can add additional areas to your account to receive specifically targeted messages.</li>' +
                      '<li>In the case of a registered personal phone number, your preferences will be defaulted initially to the area associated with your official base work location. However, this can be removed and additional preferences added.</li>' +
                    '</ul>'
            }
          }]
        }
      }, {
        heading: 'Management of the system',
        accordion: {
          id: 'faqs-management-of-the-system',
          items: [{
            heading: { text: 'If I leave the organisation what happens to my registered details?' },
            content: {
              html: '<p>An individual’s data is subject to the Joiners, Movers and Leavers process (JML). On leaving the organisation your data will be removed or flagged as inactive by HR and be reflected in subsequent data imports to the system. This will ensure the text alerts are not issued to both the company phone number if allocated and to any registered personal phone number.</p>'
            }
          }, {
            heading: { text: 'How often is the data refreshed from the core systems?' },
            content: {
              html: '<p>Currently the plan is to refresh weekly on a Sunday; however the System Administrators can amend this frequency, as well as having the option to invoke an additional update at any time.</p>'
            }
          }, {
            heading: { text: 'How do I know my data is secure?' },
            content: {
              html: '<ul>' +
                      '<li>Data held within the system is encrypted at rest and uses TLS over HTTPS whilst in transit.</li>' +
                      '<li>Defra Security Assurance has certified the system and an independent IT Health Check was undertaken which included penetration testing to validate the security of the Service.</li>' +
                    '</ul>'
            }
          }]
        }
      }]
      return h.view(routeId, { sections })
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  }
]
