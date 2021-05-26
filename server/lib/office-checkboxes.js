/**
 * Generates [GOV.UK
 * checkboxes](https://design-system.service.gov.uk/components/checkboxes/) to
 * be used within a [GOV.UK
 * accordion](https://design-system.service.gov.uk/components/accordion/).
 * Area sections will initially be expanded if they contain a checked option.
 *
 * @param {Array} areaToOfficeMap - array of areas containing an array of officeLocations
 * @param {Array} [checked=[]] - array of office codes to be checked
 * @param {Array} [disabled=[]] - array of office codes to be disabled
 */
module.exports = (areaToOfficeMap, checked = [], disabled = []) => {
  const areasToExpand = checked.map(c => c.split(':')[0])
  return areaToOfficeMap.map(area => {
    const checkboxes = area.officeLocations.map(ol => {
      const officeCode = ol.officeCode
      return `<div class="govuk-checkboxes__item">
        <input class="govuk-checkboxes__input" id="officeLocations_${officeCode}" name="officeCodes" type="checkbox" value="${officeCode}" ${checked.includes(officeCode) ? 'checked=""' : ''} ${disabled.includes(officeCode) ? 'disabled=""' : ''}>
          <label class="govuk-label govuk-checkboxes__label" for="officeLocations_${officeCode}">${ol.officeLocation}</label>
      </div>`
    })
    return {
      expanded: areasToExpand.includes(area.areaCode),
      heading: {
        text: area.areaName
      },
      content: {
        html: `<div class="govuk-form-group">
          <div class="govuk-checkboxes govuk-checkboxes--small">
            ${checkboxes.join('')}
          </div>
        </div>`
      }
    }
  })
}
