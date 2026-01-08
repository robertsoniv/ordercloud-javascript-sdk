import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import OrderCloudError from '../src/utils/OrderCloudError'
import { Products, Tokens, Auth, Configuration } from '../src'
import { makeToken } from './utils'

const validToken = makeToken()

beforeEach(() => {
  Tokens.SetAccessToken(validToken)
})

describe('OrderCloudError - Improvements', () => {
  test('should parse standard API error with proper details', async () => {
    setupMockFetch(
      {
        Errors: [
          {
            ErrorCode: 'NotFound',
            Message: 'Product not found',
            Data: { ObjectType: 'Product', ObjectID: 'test-id' },
          },
        ],
      },
      { status: 404, statusText: 'Not Found' }
    )

    try {
      await Products.Get('test-id')
      fail('Should have thrown')
    } catch (error) {
      expect(error.isOrderCloudError).toBe(true)
      expect(error.status).toBe(404)
      expect(error.errorCode).toBe('NotFound')
      expect(error.message).toBe('Product test-id not found')
    }
  })

  test('should handle non-JSON error response (HTML)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('<html><body>502 Bad Gateway</body></html>', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers({ 'Content-Type': 'text/html' }),
      })
    )

    try {
      await Products.Get('test-id')
      fail('Should have thrown')
    } catch (error) {
      expect(error.isOrderCloudError).toBe(true)
      expect(error.status).toBe(502)
      expect(error.message).toContain('502 Bad Gateway')
    }
  })

  test('should handle Auth error correctly', async () => {
    Configuration.Set({ clientID: 'test-client-id' })
    setupMockFetch(
      {
        Errors: [
          {
            ErrorCode: 'InvalidCredentials',
            Message: 'Invalid username or password',
            Data: {},
          },
        ],
      },
      { status: 401, statusText: 'Unauthorized' }
    )

    try {
      await Auth.Login('baduser', 'badpass')
      fail('Should have thrown')
    } catch (error) {
      expect(error.isOrderCloudError).toBe(true)
      expect(error.status).toBe(401)
      expect(error.errorCode).toBe('InvalidCredentials')
      expect(error.message).toBe('Invalid username or password')
    }
  })

  test('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network request failed'))
    await expect(Products.Get('test-id')).rejects.toThrow(
      'Network request failed'
    )
  })
})
