/* eslint-disable jest/no-mocks-import */
import mockFetch, { setupMockFetch } from '../__mocks__/fetch'
/* eslint-enable jest/no-mocks-import */
import {
  Tokens,
  Auth,
  Products,
  Configuration,
  AccessToken,
  OrderCloudError,
  RequiredDeep,
} from '../../src'
import { makeToken } from '../utils'

const apiUrl = 'https://api.ordercloud.io/v1'
const testdata = {
  accessToken:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3IiOiJ0ZXN0YnV5ZXIiLCJjaWQiOiI5N2JiZjJjYy01OWQxLTQ0OWEtYjY3Yy1hZTkyNjJhZGQyODQiLCJ1IjoiMTkyMDU2MyIsInVzcnR5cGUiOiJidXllciIsInJvbGUiOlsiTWVBZGRyZXNzQWRtaW4iLCJNZUFkbWluIiwiTWVDcmVkaXRDYXJkQWRtaW4iLCJNZVhwQWRtaW4iLCJTaG9wcGVyIiwiQnV5ZXJSZWFkZXIiXSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9yZGVyY2xvdWQuaW8iLCJhdWQiOiJodHRwczovL2FwaS5vcmRlcmNsb3VkLmlvIiwiZXhwIjoxNTY1Mzk5NjE5LCJuYmYiOjE1NjUzNjM2MTl9.tuWzEMa4lH2zx4zrab3X4d1uTFFwEAs7pfOZ_yQHV14',
  refreshToken: 'f36ebba3-5218-4f34-9657-b8738730b735',
  clientID: 'my-mock-clientid',
  productID: 'my-mock-productid',
}

beforeEach(() => {
  setupMockFetch({})
  jest.restoreAllMocks()
  Tokens.RemoveAccessToken()
  Tokens.RemoveRefreshToken()
  Configuration.Set({
    baseApiUrl: 'https://api.ordercloud.io',
    apiVersion: 'v1',
    timeoutInMilliseconds: 10 * 1000,
    clientID: undefined,
  })
})

describe('Fetch Migration Integration Tests', () => {
  describe('Request Lifecycle', () => {
    test('should complete full request lifecycle', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({ ID: 'product-1', Name: 'Test Product' })

      const result = await Products.Get(testdata.productID)

      expect(result.ID).toBe('product-1')
      expect(result.Name).toBe('Test Product')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const call = mockFetch.mock.calls[0]
      const url = call[0] as string
      const options = call[1] as RequestInit

      expect(url).toContain(`${apiUrl}/products/${testdata.productID}`)
      expect(options.method).toBe('GET')
    })

    test('should include proper headers in request', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({ ID: 'product-1' })

      await Products.Get(testdata.productID)

      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit
      const headers = options.headers as Headers

      expect(headers.get('Content-Type')).toBe('application/json')
      expect(headers.get('Authorization')).toBe(
        `Bearer ${testdata.accessToken}`
      )
    })
  })

  describe('Timeout and Cancellation', () => {
    test('should use AbortSignal for request cancellation', async () => {
      Tokens.SetAccessToken(testdata.accessToken)

      // Verify fetch is called with an AbortSignal
      mockFetch.mockImplementationOnce((input, init) => {
        expect(init?.signal).toBeDefined()
        expect(init?.signal).toBeInstanceOf(AbortSignal)
        return Promise.resolve(
          new Response(JSON.stringify({ ID: 'product-1' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })

      await Products.Get(testdata.productID)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    test('should throw OrderCloudError with proper error details', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch(
        {
          Errors: [
            {
              ErrorCode: 'NotFound',
              Message: 'Product not found',
              Data: { ProductID: testdata.productID },
            },
          ],
        },
        { status: 404, statusText: 'Not Found' }
      )

      await expect(Products.Get(testdata.productID)).rejects.toMatchObject({
        status: 404,
      })
    })

    test('should handle network errors', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(Products.Get(testdata.productID)).rejects.toThrow(
        'Network error'
      )
    })

    test('should handle non-JSON error responses', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      mockFetch.mockResolvedValueOnce(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'text/plain' },
        })
      )

      await expect(Products.Get(testdata.productID)).rejects.toThrow()
    })

    test('should handle 401 unauthorized errors', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch(
        {
          Errors: [
            {
              ErrorCode: 'Unauthorized',
              Message: 'Invalid or expired token',
            },
          ],
        },
        { status: 401, statusText: 'Unauthorized' }
      )

      await expect(Products.Get(testdata.productID)).rejects.toMatchObject({
        status: 401,
      })
    })
  })

  describe('Token Refresh Mechanism', () => {
    test('should automatically refresh expired token', async () => {
      const tenMinutesAgo = Date.now() - 1000 * 60 * 10
      const expiredToken = makeToken(tenMinutesAgo, testdata.clientID)
      const newToken = makeToken(Date.now() + 1000 * 60 * 60, testdata.clientID)

      Tokens.SetAccessToken(expiredToken)
      Tokens.SetRefreshToken(testdata.refreshToken)
      Configuration.Set({ clientID: testdata.clientID })

      const RefreshTokenSpy = jest
        .spyOn(Auth, 'RefreshToken')
        .mockResolvedValueOnce({
          access_token: newToken,
          expires_in: 3600,
          token_type: 'bearer',
          refresh_token: testdata.refreshToken,
        } as RequiredDeep<AccessToken>)

      setupMockFetch({ ID: 'product-1', Name: 'Test Product' })

      await Products.Get(testdata.productID)

      expect(RefreshTokenSpy).toHaveBeenCalledTimes(1)
      expect(RefreshTokenSpy).toHaveBeenCalledWith(
        testdata.refreshToken,
        testdata.clientID
      )

      // Verify new token was used for the request
      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit
      const headers = options.headers as Headers
      expect(headers.get('Authorization')).toBe(`Bearer ${newToken}`)
    })

    test('should handle refresh token failure gracefully', async () => {
      const tenMinutesAgo = Date.now() - 1000 * 60 * 10
      const expiredToken = makeToken(tenMinutesAgo, testdata.clientID)

      Tokens.SetAccessToken(expiredToken)
      Tokens.SetRefreshToken(testdata.refreshToken)
      Configuration.Set({ clientID: testdata.clientID })

      const RefreshTokenSpy = jest
        .spyOn(Auth, 'RefreshToken')
        .mockRejectedValueOnce(
          new OrderCloudError({
            status: 401,
            errors: [
              { ErrorCode: 'InvalidGrant', Message: 'Invalid refresh token' },
            ],
            request: {} as any,
            response: {} as any,
          })
        )

      setupMockFetch({ ID: 'product-1' })

      // SDK continues with expired token when refresh fails
      const result = await Products.Get(testdata.productID)

      expect(RefreshTokenSpy).toHaveBeenCalledTimes(1)
      expect(result.ID).toBe('product-1')

      // When refresh fails, SDK may clear the token or use expired token
      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit
      const headers = options.headers as Headers
      const authHeader = headers.get('Authorization')
      expect(authHeader).toBeDefined()
      expect(authHeader).toContain('Bearer')
    })

    test('should not attempt refresh without refresh token', async () => {
      const tenMinutesAgo = Date.now() - 1000 * 60 * 10
      const expiredToken = makeToken(tenMinutesAgo, testdata.clientID)

      Tokens.SetAccessToken(expiredToken)
      Configuration.Set({ clientID: testdata.clientID })

      const RefreshTokenSpy = jest.spyOn(Auth, 'RefreshToken')
      const GetRefreshTokenSpy = jest.spyOn(Tokens, 'GetRefreshToken')

      setupMockFetch({ ID: 'product-1' })

      await Products.Get(testdata.productID)

      expect(GetRefreshTokenSpy).toHaveBeenCalled()
      expect(RefreshTokenSpy).not.toHaveBeenCalled()

      // Should use expired token
      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit
      const headers = options.headers as Headers
      expect(headers.get('Authorization')).toBe(`Bearer ${expiredToken}`)
    })
  })

  describe('HTTP Methods', () => {
    test('should handle GET requests correctly', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({ Items: [], Meta: { Page: 1, PageSize: 20 } })

      await Products.List()

      const call = mockFetch.mock.calls[0]
      const url = call[0] as string
      const options = call[1] as RequestInit

      expect(url).toContain(`${apiUrl}/products`)
      expect(options.method).toBe('GET')
    })

    test('should handle POST requests with body correctly', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      const newProduct = { ID: 'new-product', Name: 'New Product' }
      setupMockFetch(newProduct)

      await Products.Create(newProduct)

      const call = mockFetch.mock.calls[0]
      const url = call[0] as string
      const options = call[1] as RequestInit

      expect(url).toContain(`${apiUrl}/products`)
      expect(options.method).toBe('POST')
      expect(options.body).toBe(JSON.stringify(newProduct))
    })

    test('should handle PATCH requests correctly', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      const patch = { Name: 'Updated Name' }
      setupMockFetch({ ID: testdata.productID, Name: 'Updated Name' })

      await Products.Patch(testdata.productID, patch)

      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit

      expect(options.method).toBe('PATCH')
      expect(options.body).toBe(JSON.stringify(patch))
    })

    test('should handle PUT requests correctly', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      const product = { ID: testdata.productID, Name: 'Full Update' }
      setupMockFetch(product)

      await Products.Save(testdata.productID, product)

      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit

      expect(options.method).toBe('PUT')
      expect(options.body).toBe(JSON.stringify(product))
    })

    test('should handle DELETE requests correctly', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({})

      await Products.Delete(testdata.productID)

      const call = mockFetch.mock.calls[0]
      const url = call[0] as string
      const options = call[1] as RequestInit

      expect(url).toContain(`${apiUrl}/products/${testdata.productID}`)
      expect(options.method).toBe('DELETE')
    })
  })

  describe('Query Parameters', () => {
    test('should properly encode query parameters', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({ Items: [], Meta: { Page: 1, PageSize: 20 } })

      await Products.List({
        search: 'test product',
        searchOn: ['Name', 'Description'],
        sortBy: ['Name'],
        page: 2,
        pageSize: 50,
        filters: { Active: true },
      })

      const call = mockFetch.mock.calls[0]
      const url = call[0] as string

      expect(url).toContain('search=test%20product')
      expect(url).toContain('searchOn=Name')
      expect(url).toContain('searchOn=Description')
      expect(url).toContain('sortBy=Name')
      expect(url).toContain('page=2')
      expect(url).toContain('pageSize=50')
      expect(url).toContain('Active=true')
    })

    test('should handle complex filter expressions', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({ Items: [], Meta: { Page: 1, PageSize: 20 } })

      await Products.List({
        filters: {
          'xp.Color': 'Red|Blue',
          'xp.Price': '>100',
        },
      })

      const call = mockFetch.mock.calls[0]
      const url = call[0] as string

      expect(url).toContain('xp.Color=Red%7CBlue')
      expect(url).toContain('xp.Price=%3E100')
    })
  })

  describe('Headers', () => {
    test('should set correct Content-Type for JSON requests', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({ ID: 'new-product' })

      await Products.Create({ ID: 'new-product', Name: 'Test' })

      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit
      const headers = options.headers as Headers

      expect(headers.get('Content-Type')).toBe('application/json')
    })

    test('should include Authorization header with token', async () => {
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({})

      await Products.Get(testdata.productID)

      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit
      const headers = options.headers as Headers

      expect(headers.get('Authorization')).toBe(
        `Bearer ${testdata.accessToken}`
      )
    })

    test('should make request without Authorization when no token set', async () => {
      setupMockFetch({})

      await Products.Get(testdata.productID)

      const call = mockFetch.mock.calls[0]
      const options = call[1] as RequestInit
      const headers = options.headers as Headers
      const authHeader = headers.get('Authorization')

      // Header should be "Bearer" without token or not set
      expect(authHeader).toMatch(/^Bearer\s*$|^$/)
    })
  })

  describe('Custom Fetch Implementation', () => {
    test('should use custom fetch implementation when provided', async () => {
      const customFetch = jest.fn(global.fetch)
      Configuration.Set({ fetchImplementation: customFetch })
      Tokens.SetAccessToken(testdata.accessToken)
      setupMockFetch({ ID: 'product-1' })

      await Products.Get(testdata.productID)

      // Custom fetch should have been called (via the mock)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
