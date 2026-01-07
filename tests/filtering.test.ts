import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { Tokens, Me, Users, Products, Buyers } from '../src'
import { makeToken } from './utils'

const apiUrl = 'https://api.ordercloud.io/v1'
const validToken = makeToken()

beforeEach(() => {
  setupMockFetch({ Items: [], Meta: { Page: 1, PageSize: 20 } })
  Tokens.RemoveImpersonationToken()
})

test('can filter call with boolean (true)', async () => {
  Tokens.SetAccessToken(validToken)
  await Me.ListProducts({ filters: { 'xp.Featured': true } })
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
  Tokens.SetAccessToken(validToken)
  await Me.ListProducts({ filters: { IsSubmitted: false } })
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
  Tokens.SetAccessToken(validToken)
  await Me.ListOrders({ filters: { DateSubmitted: '>2020-04-20' } })
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
  Tokens.SetAccessToken(validToken)
  await Users.List('my-mock-buyerid', { filters: { LastName: 'Smith*' } })
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
  Tokens.SetAccessToken(validToken)
  await Users.List('my-mock-buyerid', {
    filters: { LastName: 'Smith*|*Jones' },
  })
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
  Tokens.SetAccessToken(validToken)
  await Products.List({ filters: { 'xp.Color': ['!red', '!blue'] } })
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
  Tokens.SetAccessToken(validToken)
  await Buyers.List({ searchOn: ['Name', 'ID'] })
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
  Tokens.SetAccessToken(validToken)
  await Buyers.List({ sortBy: ['Name', 'ID'] })
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
