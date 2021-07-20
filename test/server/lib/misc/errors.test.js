describe('errors', () => {
  const { getErrors, getMappedErrors } = require('../../../../server/lib/misc/errors')

  describe('getErrors', () => {
    test.each([
      { mappedErrors: null },
      { mappedErrors: {} }
    ])('getErrors returns default errors and errorList when mappedErrors contains no keys', ({ mappedErrors }) => {
      const errors = getErrors(mappedErrors)

      expect(errors).toHaveProperty('errors')
      expect(errors.errors).toEqual({})
      expect(errors).toHaveProperty('errorList')
      expect(errors.errorList).toEqual([])
    })

    test('getErrors returns string error as text', () => {
      const key = 'my-key'
      const val = 'some-val'
      const mappedErrors = {}
      mappedErrors[key] = val

      const errors = getErrors(mappedErrors)

      expect(errors.errors).toHaveProperty(key)
      expect(errors.errors[key]).toEqual({ text: val })
      expect(errors.errorList).toHaveLength(1)
      expect(errors.errorList[0]).toEqual({ text: val, href: `#${key}` })
    })

    test('getErrors returns error from object when mapped error is an object', () => {
      const key = 'my-key'
      const val = 'some-val'
      const mappedErrors = {}
      mappedErrors[key] = { text: val, summary: `${key}-${val}` }

      const errors = getErrors(mappedErrors)

      expect(errors.errors).toHaveProperty(key)
      expect(errors.errors[key]).toEqual({ text: val })
      expect(errors.errorList).toHaveLength(1)
      expect(errors.errorList[0]).toEqual({ text: `${key}-${val}`, href: `#${key}` })
    })
  })

  describe('getMappedErrors', () => {
    const key = 'my-key'
    const message = 'error-message'
    const type = 'my-type'

    test.each([
      { err: null },
      { err: {} },
      { err: { details: null } },
      { err: { details: {} } },
      { err: { details: 1 } },
      { err: { details: '' } }
    ])('getMappedErrors returns undefined when err is falsey and err.details is not an error', ({ err }) => {
      const mappedErrors = getMappedErrors(err)

      expect(mappedErrors).toBeUndefined()
    })

    test('getMappedErrors returns empty object when there are no details', () => {
      const err = { details: [] }

      const mappedErrors = getMappedErrors(err)

      expect(mappedErrors).toEqual({})
    })

    test('getMappedErrors returns empty object when error messages does not contain details', () => {
      const err = { details: [{ path: [key] }] }
      const errorMessages = {}

      const mappedErrors = getMappedErrors(err, errorMessages)

      expect(mappedErrors).toHaveProperty(key)
      expect(mappedErrors[key]).toEqual({})
    })

    test('getMappedErrors returns object containing details of errors when there are details - string error', () => {
      const err = { details: [{ path: [key] }] }
      const errorMessages = {}
      errorMessages[key] = message

      const mappedErrors = getMappedErrors(err, errorMessages)

      expect(mappedErrors).toHaveProperty(key)
      expect(mappedErrors[key]).toEqual(message)
    })

    test('getMappedErrors returns object containing details of errors when there are details - message, specific type', () => {
      const err = { details: [{ path: [key] }], type }
      const errorMessages = {}
      errorMessages[key] = {}
      errorMessages[key][type] = message

      const mappedErrors = getMappedErrors(err, errorMessages)

      expect(mappedErrors).toHaveProperty(key)
      expect(mappedErrors[key]).toHaveProperty(type)
      expect(mappedErrors[key][type]).toEqual(message)
    })

    test('getMappedErrors returns object containing details of errors when there are details - message, all types', () => {
      const err = { details: [{ path: [key] }], type }
      const errorMessages = {}
      errorMessages[key] = {}
      errorMessages[key]['*'] = message

      const mappedErrors = getMappedErrors(err, errorMessages)

      expect(mappedErrors).toHaveProperty(key)
      expect(mappedErrors[key]).toEqual(message)
    })

    test('getMappedErrors returns object containing details of errors when there are details - message, object type', () => {
      const err = { details: [{ path: [key] }], type }
      const errorMessages = {}
      errorMessages[key] = {}
      const msg = { id: 1 }
      errorMessages[key] = msg

      const mappedErrors = getMappedErrors(err, errorMessages)

      expect(mappedErrors).toHaveProperty(key)
      expect(mappedErrors[key]).toEqual(msg)
    })

    test('getMappedErrors returns object containing details of errors when there are details - message, number type', () => {
      const err = { details: [{ message, path: [key] }], type }
      const errorMessages = {}
      errorMessages[key] = {}
      errorMessages[key] = 1

      const mappedErrors = getMappedErrors(err, errorMessages)

      expect(mappedErrors).toHaveProperty(key)
      expect(mappedErrors[key]).toEqual(message)
    })
  })
})
