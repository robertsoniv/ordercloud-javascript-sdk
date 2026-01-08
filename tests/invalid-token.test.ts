import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import {
  OrderCloudClient,
  AccessToken,
  RequiredDeep,
} from '../src'
import { makeToken } from './utils'

const apiUrl = 'https://api.ordercloud.io/v1'
const testdata = {
  accessToken:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3IiOiJ0ZXN0YnV5ZXIiLCJjaWQiOiI5N2JiZjJjYy01OWQxLTQ0OWEtYjY3Yy1hZTkyNjJhZGQyODQiLCJ1IjoiMTkyMDU2MyIsInVzcnR5cGUiOiJidXllciIsInJvbGUiOlsiTWVBZGRyZXNzQWRtaW4iLCJNZUFkbWluIiwiTWVDcmVkaXRDYXJkQWRtaW4iLCJNZVhwQWRtaW4iLCJTaG9wcGVyIiwiQnV5ZXJSZWFkZXIiXSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9yZGVyY2xvdWQuaW8iLCJhdWQiOiJodHRwczovL2FwaS5vcmRlcmNsb3VkLmlvIiwiZXhwIjoxNTY1Mzk5NjE5LCJuYmYiOjE1NjUzNjM2MTl9.tuWzEMa4lH2zx4zrab3X4d1uTFFwEAs7pfOZ_yQHV14',
  refreshToken: 'f36ebba3-5218-4f34-9657-b8738730b735',
  accessTokenFromRefresh:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3IiOiJ0ZXN0YnV5ZXIiLCJjaWQiOiI5N2JiZjJjYy01OWQxLTQ0OWEtYjY3Yy1hZTkyNjJhZGQyODQiLCJ1IjoiMTkyMDU2MyIsInVzcnR5cGUiOiJidXllciIsInJvbGUiOlsiTWVBZGRyZXNzQWRtaW4iLCJNZUFkbWluIiwiTWVDcmVkaXRDYXJkQWRtaW4iLCJNZVhwQWRtaW4iLCJTaG9wcGVyIiwiQnV5ZXJSZWFkZXIiXSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9yZGVyY2xvdWQuaW8iLCJhdWQiOiJodHRwczovL2FwaS5vcmRlcmNsb3VkLmlvIiwiZXhwIjoxNTY1NDAwOTg5LCJuYmYiOjE1NjUzNjQ5ODl9.eitJK5A8a3JyYhBm_PGp9A93-AGSRDvbkoowA38eyIc',
  clientID: 'my-mock-clientid',
  productID: 'my-mock-productid',
  clientIDFromToken: 'client-id-from-token',
}

function expectDeleteCall(expectedToken: string) {
  expect(mockFetch).toHaveBeenCalledTimes(1)
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/products/${testdata.productID}`)
  expect(options.method).toBe('DELETE')
  const headers = options.headers as Headers
  const authHeader = headers.get('Authorization')
  if (expectedToken) {
    expect(authHeader).toBe(`Bearer ${expectedToken}`)
  } else {
    expect(authHeader).toMatch(/^Bearer\s*$/)
  }
}

let client: OrderCloudClient

beforeEach(() => {
  setupMockFetch({})
  jest.restoreAllMocks()
  client = new OrderCloudClient({
    baseApiUrl: 'https://api.ordercloud.io',
    apiVersion: 'v1',
    timeoutInMilliseconds: 10 * 1000,
  })
})

// Note: In the new architecture, token management is internal to the client
// Tests have been simplified to focus on external behavior rather than internal token handling

describe('token handling', () => {
  test('should make call with provided access token', async () => {
    const validToken = makeToken()
    await client.Products.Delete(testdata.productID, { accessToken: validToken })
    expectDeleteCall(validToken)
  })

  test('should make call with no access token when none provided', async () => {
    await client.Products.Delete(testdata.productID)
    expectDeleteCall('')
  })

  test('should accept valid token via requestOptions', async () => {
    const tenMinutesFromNow = Date.now() + 1000 * (60 * 10)
    const token = makeToken(tenMinutesFromNow, testdata.clientIDFromToken)
    await client.Products.Delete(testdata.productID, { accessToken: token })
    expectDeleteCall(token)
  })
})
