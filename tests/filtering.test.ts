import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { OrderCloudClient } from '../src'
import { makeToken } from './utils'

const apiUrl = 'https://api.ordercloud.io/v1'
const validToken = makeToken()

let client: OrderCloudClient

beforeEach(() => {
  setupMockFetch({ Items: [], Meta: { Page: 1, PageSize: 20 } })
  client = new OrderCloudClient()
})

test('can filter call with boolean (true)', async () => {
  await client.Me.ListProducts({ filters: { 'xp.Featured': true } }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/me/products`)
  expect(url).toContain('xp.Featured=true')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can filter call with boolean (false)', async () => {
  await client.Me.ListProducts({ filters: { IsSubmitted: false } }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/me/products`)
  expect(url).toContain('IsSubmitted=false')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can filter call with comparison operator', async () => {
  await client.Me.ListOrders({ filters: { DateSubmitted: '>2020-04-20' } }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/me/orders`)
  expect(url).toContain('DateSubmitted')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can filter call with wildcard operator', async () => {
  await client.Users.List('my-mock-buyerid', { filters: { LastName: 'Smith*' } }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/buyers/my-mock-buyerid/users`)
  expect(url).toContain('LastName=Smith')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can filter with logical OR operator', async () => {
  await client.Users.List('my-mock-buyerid', {
    filters: { LastName: 'Smith*|*Jones' },
  }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/buyers/my-mock-buyerid/users`)
  expect(url).toContain('LastName')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can filter with logical AND operator', async () => {
  await client.Products.List({ filters: { 'xp.Color': ['!red', '!blue'] } }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products`)
  expect(url).toContain('xp.Color')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can use multiple searchOn parameters', async () => {
  await client.Buyers.List({ searchOn: ['Name', 'ID'] }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/buyers`)
  expect(url).toContain('searchOn=Name')
  expect(url).toContain('searchOn=ID')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can use multiple sortBy parameters', async () => {
  await client.Buyers.List({ sortBy: ['Name', 'ID'] }, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/buyers`)
  expect(url).toContain('sortBy=Name')
  expect(url).toContain('sortBy=ID')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})
