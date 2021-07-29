const routeId = 'faqs'
const path = `/${routeId}`

module.exports = [
  {
    method: 'GET',
    path,
    handler: (request, h) => {
      const sections = [{
        heading: 'Purpose and Objectives of the Service',
        accordion: {
          id: 'faqs-purpose-and-objectives',
          items: [{
            heading: { text: 'What is the purpose of Defra’s Single Group Wide Alert Service?' },
            content: {
              html: '<p>The Service has been stood up to provide a centralised facility which can rapidly inform staff of impacting events and guided instructions via text alerting. This service is required to limit loss of staff productivity and protect the safety of staff within the organisation.</p>'
            }
          }, {
            heading: { text: 'Why has the Single Group Wide Alert Service been commissioned?' },
            content: {
              html: '<p>Currently across the Defra family, whilst a number of group organisations have various means of communicating to their workforce, there is not currently a service that has the means to rapidly disseminate information across the whole of the Group.</p>'
            }
          }, {
            heading: { text: 'Why is it important to have the Group Wide capability?' },
            content: {
              html: '<p>Operational and administrative sites are likely to be cohabited by multiple organisations within the Group and there is likely to be travel between the respective organisations. Incidents / Events pertaining to the health and safety of any member of the workforce either operating out of a particular location site held within a specified Area , in transit to or through such a location or planning a journey need to be advised in order to take appropriate steps to maintain their wellbeing and those of their colleagues.</p>'
            }
          }, {
            heading: { text: 'What sorts of messages am I likely to receive?' },
            content: {
              html: '<ul>' +
                      '<li>All-hands communication of events of national importance relevant to Defra employees.</li>' +
                      '<li>Communication of events relevant to employees of a specific organisation, or group of organisations.</li>' +
                      '<li>Major IT system failures which prohibits critical activity delivery e.g. cyber-attack, loss of data centres/hosting. Not for messaging re BAU system outages that can be fixed quickly or where business impact is low.</li>' +
                      '<li>Crisis response scenarios e.g. major weather events preventing staff travel, use of buildings, CNI facilities etc.</li>' +
                      '<li>Terrorist attack e.g. several examples of attacks in central London in recent years.</li>' +
                      '<li>Other non-specified messages of a critical nature that require immediate dissemination via text to the group as advised by ExCo/Perm Sec/SOS etc.</li>' +
                    '</ul>'
            }
          }, {
            heading: { text: 'What is the likely frequency of messages sent?' },
            content: {
              html: '<p>Messaging is expected to be infrequent due to the consented purpose the Service is set up for, and past business continuity and security events, however due to the unpredictability of future events, the specific number of likely messages cannot be quantified, although in all cases the messaging will be contextual and limited to provide the necessary guidance when events occur.</p>'
            }
          }]
        }
      }, {
        heading: 'Communication Method',
        accordion: {
          id: 'faqs-communication-method',
          items: [{
            heading: { text: 'What is SMS?' },
            content: {
              html: '<p>SMS (Short Messaging Service) is a text messaging component of most telephone, Internet and mobile device systems.</p>'
            }
          }, {
            heading: { text: 'Does the Service support email?' },
            content: {
              html: '<p>Currently email messaging is not supported. The Service is only intended to issue SMS text Alerts.</p>'
            }
          }, {
            heading: { text: 'Why has SMS text messaging the preferred means of communication?' },
            content: {
              html: '<p>SMS text alerting provides the capability to issue a message of importance quickly without the reliance of the end recipient having access to Defra Group approved device or necessarily a smart phone. It therefore provides the most consistent means to disseminate information outside of the working environment or during a times when normal operation facilities are impaired in some way.</p>'
            }
          }, {
            heading: { text: 'Who will be responsible for issuing any text messaging?' },
            content: {
              html: '<p>Defra Internal Communications Team will be responsible for the issuing of messages, supported by members of the Business Continuity Team.</p>'
            }
          }, {
            heading: { text: 'Is the Service formally approved to communicate to the Group Workforce?' },
            content: {
              html: '<p>Yes a Data Protection Impact Assessment (DPIA) has been approved by the Data Protection Managers across the Defra Group.</p>'
            }
          }, {
            heading: { text: 'Which Organisations will receive the messaging?' },
            content: {
              html: '<p>The following organisation are in scope initially by default:</p>' +
                    '<ul>' +
                      '<li>APHA</li>' +
                      '<li>Defra</li>' +
                      '<li>Environment Agency</li>' +
                      '<li>Marine Management Organisation</li>' +
                      '<li>Natural England</li>' +
                      '<li>Rural Payments Agency</li>' +
                    '</ul>' +
                    '<p>*Arm’s Lengths Bodies within the Defra Family will have the option to subscribe to the Service in future.</p>'
            }
          }, {
            heading: { text: 'Will messages always be sent to all users held within the system?' },
            content: {
              html: '<p>Generally in the case of a major business continuity or security event it is likely that an alert will be issued to all users with a registered mobile number. However recipients can be selected based on any combination of Organisation and Area dependent on the necessity to advise specific groups.</p>'
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
                      '<li>Access to the system is via the following URL <a href="https://gwa-web-prd.azure.defra.cloud/">https://gwa-web-prd.azure.defra.cloud/</a></li>' +
                      '<li>You will be identified through Active Directory Authentication on your Defra approved device and therefore will not require a userid or password to access the system.</li>' +
                      '<li>It is recommended that you add the above URL to your favourites within your browser or create a shortcut on your device Desktop.</li>' +
                    '</ul>'
            }
          }, {
            heading: { text: 'Can I access the Service to make amendments to my preferences on my own personal device?' },
            content: {
              html: '<p>The service is specifically designed from a security perspective to identify you and provide access through a Defra provided or approved device. Personal devices will not recognise your credentials and therefore prevent access to the system.</p>'
            }
          }, {
            heading: { text: 'Can I opt out of receiving messages?' },
            content: {
              html: '<p>There is no opt-out arrangement for anyone who has a Company provided mobile phone. If you have registered a personal mobile phone number you have the option to remove the number and or the Area preferences registered against it.</p>'
            }
          }, {
            heading: { text: 'Are there any limits to how many personal phone numbers that can be registered?' },
            content: {
              html: '<p>Each user is limited to one personal mobile phone number.</p>'
            }
          }, {
            heading: { text: 'Can I remove or amend my personal number entered?' },
            content: {
              html: '<p>Yes you are back to replace or remove any numbers you have registered as well as amending or removing any Area preferences previously set up.</p>'
            }
          }, {
            heading: { text: 'Can I remove my company mobile phone number from the system?' },
            content: {
              html: '<p>No this is no permissible. Only additional personal numbers registered can be removed from the system.</p>'
            }
          }, {
            heading: { text: 'Can I change my base location, or organisation details if they are incorrect?' },
            content: {
              html: '<p>You are not able to amend these directly with the Service. Any required amendments to your personal data, should be directed to your HR representative or Line Manager.</p>'
            }
          }, {
            heading: { text: 'How many additional locations can I subscribe to?' },
            content: {
              html: '<p>There are no restrictions to the number of additional Areas that can be subscribed to.</p>'
            }
          }, {
            heading: { text: 'Can I amend my Area Location choices?' },
            content: {
              html: '<ul>' +
                      '<li>You default official base work location is fixed within the system if you have a Company Mobile Phone and the Area it is associated with it cannot be changed, however you have the option to add new and amend additional Areas to receive specifically targeted messages.</li>' +
                      '<li>In the case of a registered personal phone number, your preferences will be defaulted initially to your Area associated with you official base work location. However this can be removed and additional preferences added.</li>' +
                    '</ul>'
            }
          }]
        }
      }, {
        heading: 'Management of the System',
        accordion: {
          id: 'faqs-management-of-the-system',
          items: [{
            heading: { text: 'If I leave the organisation what happens to my registered details?' },
            content: {
              html: '<p>An individual’s data is subject to the Joiners, Movers and Leavers process (JML). On leaving the organisation your data will be removed or flagged as inactive by HR and be reflected in subsequent data imports to the system. This will ensure the text alerts are not issued to both the company phone number if allocated and to any registered personal phone number.</p>'
            }
          }, {
            heading: { text: 'How often is the Data refreshed from the Core Systems?' },
            content: {
              html: '<p>Currently the plan is to refresh weekly on a Sunday, however the frequency of update can be amended by the System Administrators to vary this, together with an option for the administrator to invoke a further update at any time.</p>'
            }
          }, {
            heading: { text: 'How do I know my data is secure?' },
            content: {
              html: '<ul>' +
                      '<li>The system data is held within Defra’s Azure Tenancy. All data held is encrypted handled by Microsoft Managed Key.</li>' +
                      '<li>Data imported, and accessed, and issued is through HTTPS which uses TLS for encryption.</li>' +
                      '<li>Defra security Assurance has certified the system and an independent IT Health Check was undertaken which included penetration testing to validate the security of the Service.</li>' +
                    '</ul>'
            }
          }]
        }
      }, {
        heading: 'Data Management (Administrator and Data Manager Role Only)',
        accordion: {
          id: 'faqs-data-management',
          items: [{
            heading: { text: 'Why is Organisational and Area Date held within the reference module of the system?' },
            content: {
              html: '<p>The consolidated source data introduces some inconsistencies and omissions to which the Organisational and Area reference data resolves on importation to the system.</p>'
            }
          }, {
            heading: { text: 'Who can amend Organisations or Area data?' },
            content: {
              html: '<p>System Administrators (who have full access to all functions to the system) and Data Managers who have specific privileges grant to undertake this activity.</p>'
            }
          }, {
            heading: { text: 'How to I introduce new sites?' },
            content: {
              html: '<ul>' +
                      '<li>New sites can be added by using the export function within the Data Reference module, which will generate an excel spreadsheet to append the new record(s), map to source data site information and assign to the appropriate Area. Once completed this data can be imported back into the system.</li>' +
                      '<li>It is recommended that a system update is then executed to ensure that source data aligned with the newly introduced records.</li>' +
                    '</ul>'
            }
          }, {
            heading: { text: 'How do I remove closed sites?' },
            content: {
              html: '<ul>' +
                      '<li>The removal of sites follows a similar pattern as introducing a new site. Initially within the Data Reference Module use the export function to generate an excel spreadsheet. It will be necessary to ensure that any site information mapped against source data is remapped to an alternative site, in order orphaned records are not generated on import. Once all associated records from the site to be remove are remapped, the spreadsheet can be saved and imported back into the system.</li>' +
                      '<li>It is recommended that a system update is then executed to ensure that source data aligned with the removed and newly remapped records.</li>' +
                    '</ul>'
            }
          }]
        }
      }, {
        heading: 'Disaster Recovery Arrangements',
        accordion: {
          id: 'faqs-disaster-recovery',
          items: [{
            heading: { text: 'Can messages be issued in the event of a complete system failure within Defra?' },
            content: {
              html: '<ul>' +
                      '<li>In the unlikely event of the Defra Azure Tenancy suffering a complete failure and no alternative means to communicate to the workforce, a business continuity process is available to allow direct manual access to the Gov.</li>' +
                      '<li>A file will be created and sent in an encrypted format to the System Administrators Group Mailbox. This is updated for every data refresh that is either undertaken on an automated scheduled or manually requested by a System Administrator.</li>' +
                      '<li>This file can be taken offline to be uploaded to Gov.Notify with a supporting message.</li>' +
                      '<li>It should be noted that during such a business continuity event it is expected that any message prepared is issued to the complete workforce represented within the dataset.</li>' +
                    '</ul>'
            }
          }, {
            heading: { text: 'Who do I contact if I have a query?' },
            content: {
              html: '<p>We encourage all users to access the guidance and the above FAQ’s which in most cases should answer any specific questions arising around system usage. However, should a query arise where an appropriate answer is not currently provided, please direct your question to ...@...</p>'
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
