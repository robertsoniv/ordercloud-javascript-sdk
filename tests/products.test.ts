import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { OrderCloudClient, Product } from '../src'
import { makeToken } from './utils'

const apiUrl = 'https://api.ordercloud.io/v1'
const validToken = makeToken()

let client: OrderCloudClient

beforeEach(() => {
  setupMockFetch({ ID: 'mock-id', Name: 'Mock Product' })
  client = new OrderCloudClient()
  // Note: Tokens are now managed internally by the client
  // We can still set them for testing purposes if needed
})

test('can create product', async () => {
  // Set access token on the client instance
  const product: Product = {
    Name: 'Tennis Balls',
    ID: 'TB2038',
  }
  await client.Products.Create(product, { accessToken: validToken })
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
  const productID = 'mockproductid'
  const partialProduct: Partial<Product> = {
    Description: 'This product is pretty sweet, trust me',
  }
  await client.Products.Patch(productID, partialProduct, { accessToken: validToken })
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
  const productID = 'mockproductid'
  const product: Product = {
    Name: 'Tennis Balls',
    Description: 'This product is pretty sweet, trust me',
  }
  await client.Products.Save(productID, product, { accessToken: validToken })
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
  const productID = 'mockproductid'
  await client.Products.Delete(productID, { accessToken: validToken })
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
