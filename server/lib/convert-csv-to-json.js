const csv = require('csvtojson')

module.exports = async (readableStream) => {
  console.log('CONVERTING')
  try {
    const data = await csv({ headers: ['oName', 'aCode', 'aName'] }).fromStream(readableStream)
    console.log(data)
    return data
    // readableStream.pipe(csv()).pipe(console.log)
  } catch (err) {
    console.error(err)
  }
}
