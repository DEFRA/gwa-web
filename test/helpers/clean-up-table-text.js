module.exports = header => {
  return header.trim().replace(/[\n\r\t]/g, '').replace(/ +/g, ' ')
}
