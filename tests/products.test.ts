import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { Tokens, Products, Product } from '../src'
import { makeToken } from './utils'

const apiUrl = 'https://api.ordercloud.io/v1'
const validToken = makeToken()

beforeEach(() => {
  setupMockFetch({ ID: 'mock-id', Name: 'Mock Product' })
  Tokens.RemoveAccessToken()
})

test('can create product', async () => {
  Tokens.SetAccessToken(validToken)
  const product: Product = {
    Name: 'Tennis Balls',
    ID: 'TB2038',
  }
  await Products.Create(product)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products`)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(JSON.stringify(product))
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can patch product', async () => {
  Tokens.SetAccessToken(validToken)
  const productID = 'mockproductid'
  const partialProduct: Partial<Product> = {
    Description: 'This product is pretty sweet, trust me',
  }
  await Products.Patch(productID, partialProduct)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products/${productID}`)
  expect(options.method).toBe('PATCH')
  expect(options.body).toBe(JSON.stringify(partialProduct))
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can update product', async () => {
  Tokens.SetAccessToken(validToken)
  const productID = 'mockproductid'
  const product: Product = {
    Name: 'Tennis Balls',
    Description: 'This product is pretty sweet, trust me',
  }
  await Products.Save(productID, product)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products/${productID}`)
  expect(options.method).toBe('PUT')
  expect(options.body).toBe(JSON.stringify(product))
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})

test('can delete product', async () => {
  Tokens.SetAccessToken(validToken)
  const productID = 'mockproductid'
  await Products.Delete(productID)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products/${productID}`)
  expect(options.method).toBe('DELETE')
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})
