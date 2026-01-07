import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { Tokens, Products } from '../src'
import { makeToken } from './utils'

const apiUrl = 'https://api.ordercloud.io/v1'
const testdata = {
  productID: 'my-mock-product-id',
}

beforeEach(() => {
  setupMockFetch({})
  Tokens.RemoveImpersonationToken()
})

test('should use impersonation token if call As method', async () => {
  const impersonationToken = makeToken()
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3IiOiJ0ZXN0YnV5ZXIiLCJjaWQiOiI5N2JiZjJjYy01OWQxLTQ0OWEtYjY3Yy1hZTkyNjJhZGQyODQiLCJ1IjoiMTkyMDU2MyIsInVzcnR5cGUiOiJidXllciIsInJvbGUiOlsiTWVBZGRyZXNzQWRtaW4iLCJNZUFkbWluIiwiTWVDcmVkaXRDYXJkQWRtaW4iLCJNZVhwQWRtaW4iLCJTaG9wcGVyIiwiQnV5ZXJSZWFkZXIiXSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9yZGVyY2xvdWQuaW8iLCJhdWQiOiJodHRwczovL2FwaS5vcmRlcmNsb3VkLmlvIiwiZXhwIjoxNTY1NDE2Njg1LCJuYmYiOjE1NjUzODA2ODV9.Fa35Zwz3dsolWgb2X2T4119RxZAGQiE2NoeRNeLaUek'
  Tokens.SetImpersonationToken(impersonationToken)
  await Products.As().Delete(testdata.productID)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products/${testdata.productID}`)
  expect(options.method).toBe('DELETE')
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${impersonationToken}`)
})

test('should use passed in token if defined', async () => {
  const token = makeToken()
  await Products.Delete(testdata.productID, { accessToken: token })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products/${testdata.productID}`)
  expect(options.method).toBe('DELETE')
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${token}`)
})

test('should prioritize passed in token', async () => {
  const impersonationToken = makeToken()
  Tokens.SetImpersonationToken(impersonationToken)
  const token = makeToken()
  await Products.As().Delete(testdata.productID, { accessToken: token })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products/${testdata.productID}`)
  expect(options.method).toBe('DELETE')
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${token}`)
})
