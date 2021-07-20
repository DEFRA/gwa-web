function getSelectedValue (selectedValue) {
  return selectedValue ? !selectedValue : true
}

module.exports = selectedValue => {
  if (typeof (selectedValue) === 'string') {
    selectedValue = selectedValue === 'true'
  }
  return [{
    checked: (selectedValue === undefined || !selectedValue) ? undefined : selectedValue,
    value: true,
    text: 'Yes'
  }, {
    checked: (selectedValue === undefined || selectedValue) ? undefined : getSelectedValue(selectedValue),
    value: false,
    text: 'No'
  }]
}
