describe('db functions', () => {
  const db = require('../../../server/lib/db')
  const { referenceData } = require('../../../server/constants')

  jest.mock('../../../server/db/client')
  const { messagesContainer, receiptsContainer, refDataContainer, usersContainer } = require('../../../server/db/client')

  const usersFetchAllMock = jest.fn()
  usersContainer.items = {
    query: jest.fn(() => {
      return {
        fetchAll: usersFetchAllMock
      }
    })
  }
  const userReadMock = jest.fn()
  const userReplaceMock = jest.fn()
  usersContainer.item = jest.fn(() => {
    return {
      read: userReadMock,
      replace: userReplaceMock
    }
  })

  const msgFetchAllMock = jest.fn()
  const msgUpsertMock = jest.fn()
  messagesContainer.items = {
    query: jest.fn(() => {
      return {
        fetchAll: msgFetchAllMock
      }
    }),
    upsert: msgUpsertMock
  }
  const msgDeleteMock = jest.fn()
  const msgReadMock = jest.fn()
  const msgReplaceMock = jest.fn()
  messagesContainer.item = jest.fn(() => {
    return {
      delete: msgDeleteMock,
      read: msgReadMock,
      replace: msgReplaceMock
    }
  })

  const receiptsFetchAllMock = jest.fn()
  receiptsContainer.items = {
    query: jest.fn(() => {
      return {
        fetchAll: receiptsFetchAllMock
      }
    })
  }

  const refDataReadMock = jest.fn()
  const refDataReplaceMock = jest.fn()
  refDataContainer.item = jest.fn(() => {
    return {
      read: refDataReadMock,
      replace: refDataReplaceMock
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    { func: 'getAreaToOfficeMap', refDataId: referenceData.areaToOfficeMap },
    { func: 'getOrganisationList', refDataId: referenceData.organisationList },
    { func: 'getOrganisationMap', refDataId: referenceData.organisationMap },
    { func: 'getStandardisedOfficeLocationMap', refDataId: referenceData.standardisedOfficeLocationMap }
  ])('%%', async ({ func, refDataId }) => {
    const data = [{ a: 1 }]
    refDataReadMock.mockResolvedValue({ resource: { data } })

    const res = await db[func]()

    expect(res).toEqual(data)
    expect(refDataContainer.item).toBeCalledTimes(1)
    expect(refDataContainer.item).toBeCalledWith(refDataId, refDataId)
  })

  test('deleteMessage', async () => {
    const id = 'id'
    const data = { a: 1 }
    msgDeleteMock.mockResolvedValue(data)

    const res = await db.deleteMessage(id)

    expect(res).toEqual(data)
    expect(messagesContainer.item).toBeCalledTimes(1)
    expect(messagesContainer.item).toBeCalledWith(id, id)
    expect(messagesContainer.item().delete).toBeCalledTimes(1)
  })

  test('getMessage', async () => {
    const id = 'id'
    const data = { a: 1 }
    msgReadMock.mockResolvedValue({ resource: data })

    const res = await db.getMessage(id)

    expect(res).toEqual(data)
    expect(messagesContainer.item).toBeCalledTimes(1)
    expect(messagesContainer.item).toBeCalledWith(id, id)
    expect(messagesContainer.item().read).toBeCalledTimes(1)
  })

  test('getMessages', async () => {
    const data = [{ a: 1 }]
    msgFetchAllMock.mockResolvedValue({ resources: data })
    const query = 'something, something get it all and make upside down'

    const res = await db.getMessages(query)

    expect(res).toEqual(data)
    expect(messagesContainer.items.query).toBeCalledTimes(1)
    expect(messagesContainer.items.query).toBeCalledWith(query)
    expect(messagesContainer.items.query().fetchAll).toBeCalledTimes(1)
  })

  test('getReceipts', async () => {
    const data = [{ a: 1 }]
    receiptsFetchAllMock.mockResolvedValue({ resources: data })
    const query = 'query me this, query me that'

    const res = await db.getReceipts(query)

    expect(res).toEqual(data)
    expect(receiptsContainer.items.query).toBeCalledTimes(1)
    expect(receiptsContainer.items.query).toBeCalledWith(query)
    expect(receiptsContainer.items.query().fetchAll).toBeCalledTimes(1)
  })

  test('getUser', async () => {
    const id = 'id'
    const data = { a: 1 }
    userReadMock.mockResolvedValue({ resource: data })

    const res = await db.getUser(id)

    expect(res).toEqual(data)
    expect(usersContainer.item).toBeCalledTimes(1)
    expect(usersContainer.item).toBeCalledWith(id, id)
    expect(usersContainer.item().read).toBeCalledTimes(1)
  })

  test('getUsers', async () => {
    const data = [{ a: 1 }]
    usersFetchAllMock.mockResolvedValue({ resources: data })

    const res = await db.getUsers()

    expect(res).toEqual(data)
    expect(usersContainer.items.query).toBeCalledTimes(1)
    expect(usersContainer.items.query).toBeCalledWith('SELECT c.active, c.orgCode, c.phoneNumbers FROM c', { maxItemCount: 50000 })
    expect(usersContainer.items.query().fetchAll).toBeCalledTimes(1)
  })

  test('upsertMessage', async () => {
    const data = { a: 1 }
    const message = { id: 'id' }
    msgUpsertMock.mockResolvedValue(data)

    const res = await db.upsertMessage(message)

    expect(res).toEqual(data)
    expect(messagesContainer.items.upsert).toBeCalledTimes(1)
    expect(messagesContainer.items.upsert).toBeCalledWith(message)
  })

  test('updateUser', async () => {
    const data = { a: 1 }
    const user = { id: 'id' }
    userReplaceMock.mockResolvedValue(data)

    const res = await db.updateUser(user)

    expect(res).toEqual(data)
    expect(usersContainer.item).toBeCalledTimes(1)
    expect(usersContainer.item).toBeCalledWith(user.id, user.id)
    expect(usersContainer.item().replace).toBeCalledTimes(1)
    expect(usersContainer.item().replace).toBeCalledWith(user)
  })

  test('updateReferenceData', async () => {
    const data = { a: 1 }
    const refDataItem = { id: 'id' }
    refDataReplaceMock.mockResolvedValue(data)

    const res = await db.updateReferenceData(refDataItem)

    expect(res).toEqual(data)
    expect(refDataContainer.item).toBeCalledTimes(1)
    expect(refDataContainer.item).toBeCalledWith(refDataItem.id, refDataItem.id)
    expect(refDataContainer.item().replace).toBeCalledTimes(1)
    expect(refDataContainer.item().replace).toBeCalledWith(refDataItem)
  })
})
