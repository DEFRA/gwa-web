module.exports = (selectedValue) => {
  if (typeof (selectedValue) === 'string') {
    selectedValue = selectedValue === 'true'
  }
  return [{
    checked: (selectedValue === undefined || !selectedValue) ? undefined : selectedValue || false,
    value: true,
    text: 'Yes'
  }, {
    checked: (selectedValue === undefined || selectedValue) ? undefined : selectedValue ? !selectedValue : true,
    value: false,
    text: 'No'
  }]
}
