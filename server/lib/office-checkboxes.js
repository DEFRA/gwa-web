function generateCheckbox (officeLocation, checked, disabled) {
  const officeCode = officeLocation.officeCode
  const officeArea = officeCode.split(':')[0]
  const checkedAreas = checked.map(x => x.split(':')[0])
  return '<div class="govuk-checkboxes__item">' +
           `<input class="govuk-checkboxes__input" id="officeLocations_${officeCode}" name="officeCodes" type="checkbox" value="${officeCode}" ${checkedAreas.includes(officeArea) ? 'checked=""' : ''} ${disabled.includes(officeCode) ? 'disabled=""' : ''}>` +
           `<label class="govuk-label govuk-checkboxes__label" for="officeLocations_${officeCode}">${officeLocation.officeLocation}</label>` +
         '</div>'.replace(/\n/g, '').replace(/> +</g, '><')
}

function generateOfficeList (officeLocations) {
  return '<ul class="govuk-list govuk-list--bullet">' +
           officeLocations.map(ol => `<li>${ol.officeLocation}</li>`).join('') +
         '</ul>'
}

/**
 * Generates a
 * [GOV.UK accordion](https://design-system.service.gov.uk/components/accordion/)
 * component for office locations grouped by area. Each area is a collapsible
 * section containing a
 * [GOV.UK checkbox](https://design-system.service.gov.uk/components/checkboxes/)
 * for all of the offices within the area. And a listing of the individual
 * office locations within the area.
 * Area sections will initially be expanded if they contain a checked option.
 *
 * @param {object} areaToOfficeMap map of areas with `officeLocations`.
 * @param {Array} [checked=[]] list of office codes to be checked - only
 * applicable to area level office codes.
 * @param {Array} [disabled=[]] list of office codes to be disabled - only
 * applicable to area level office codes.
 * @returns {Array} `items` for GOV.UK accordion.
 */
module.exports = (areaToOfficeMap, checked = [], disabled = []) => {
  const areasToExpand = checked.map(c => c.split(':')[0])

  return areaToOfficeMap.map(area => {
    const officeLocationsList = generateOfficeList(area.officeLocations)
    const allLocationsCheckbox = generateCheckbox({ officeCode: `${area.areaCode}:*`, officeLocation: `All office locations in the <strong>${area.areaName}</strong> area` }, checked, disabled)
    return {
      expanded: areasToExpand.includes(area.areaCode),
      heading: { text: area.areaName },
      content: {
        html: '<div class="govuk-form-group govuk-!-margin-bottom-0">' +
                `<div class="govuk-checkboxes govuk-checkboxes--small">${allLocationsCheckbox}</div>` +
              '</div>' +
              '<div class="govuk-form-group">' +
                officeLocationsList +
              '</div>'
      }
    }
  })
}
