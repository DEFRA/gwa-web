const internalStatus = 'Internal'

// Statuses are set in `gwa-notification-sender`, if a change is required it
// will need to be done there. These are effectively readonly.
const internalStatuses = {
  dbConflict: `${internalStatus}: DB conflict`,
  failedToSend: `${internalStatus}: Failed to send`,
  rateLimited: `${internalStatus}: Rate limit exceeded`,
  retry: `${internalStatus}: To be retried`,
  sent: `${internalStatus}: Sent to Notify`
}

const notifyStatus = 'Notify'
// Notify statuses are listed
// [here](https://docs.notifications.service.gov.uk/node.html#delivery-receipts)
const notifyStatuses = {
  delivered: `${notifyStatus}: delivered`,
  permanentFailure: `${notifyStatus}: permanentFailure`,
  temporaryFailure: `${notifyStatus}: temporaryFailure`,
  technicalFailure: `${notifyStatus}: technicalFailure`
}

module.exports = {
  internalStatuses,
  notifyStatuses
}
