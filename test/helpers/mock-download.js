const { Readable } = require('stream').Stream

module.exports = (contents, encoding) => {
  const mockReadable = new Readable({ read () {} })
  if (encoding) {
    mockReadable.setEncoding(encoding) // default is null
  }
  mockReadable.push(contents)
  mockReadable.push(null)
  return { readableStreamBody: mockReadable }
}
