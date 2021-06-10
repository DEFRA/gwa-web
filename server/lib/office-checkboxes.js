function generateCheckbox (officeLocation, checked, disabled) {
  const officeCode = officeLocation.officeCode
  return `<div class="govuk-checkboxes__item">
    <input class="govuk-checkboxes__input" id="officeLocations_${officeCode}" name="officeCodes" type="checkbox" value="${officeCode}" ${checked.includes(officeCode) ? 'checked=""' : ''} ${disabled.includes(officeCode) ? 'disabled=""' : ''}>
      <label class="govuk-label govuk-checkboxes__label" for="officeLocations_${officeCode}">${officeLocation.officeLocation}</label>
  </div>`.replace(/\n/g, '').replace(/> +</g, '><')
}

/**
 * Generates items for use in a [GOV.UK
 * checkboxes](https://design-system.service.gov.uk/components/checkboxes/) to
 * be used within a [GOV.UK
 * accordion](https://design-system.service.gov.uk/components/accordion/).
 * Area sections will initially be expanded if they contain a checked option.
 *
 * @param {object} areaToOfficeMap map of areas with `officeLocations`.
 * @param {Array} [checked=[]] list of office codes to be checked.
 * @param {Array} [disabled=[]] list of office codes to be disabled.
 * @returns {Array} `items` for GOV.UK accordion.
 */
module.exports = (areaToOfficeMap, checked = [], disabled = []) => {
  const areasToExpand = checked.map(c => c.split(':')[0])

  return areaToOfficeMap.map(area => {
    const checkboxes = area.officeLocations.map(ol => generateCheckbox(ol, checked, disabled))
    checkboxes.unshift(generateCheckbox({ officeCode: `${area.areaCode}:*`, officeLocation: `All office locations in the <strong>${area.areaName}</strong> area` }, checked, disabled))
    return {
      expanded: areasToExpand.includes(area.areaCode),
      heading: { text: area.areaName },
      content: {
        html: `<div class="govuk-form-group"><div class="govuk-checkboxes govuk-checkboxes--small">${checkboxes.join('')}</div></div>`
      }
    }
  })
}
