/**
 * Mock fetch implementation for testing
 */

/**
 * Creates a valid mock JWT token for testing
 * Format: header.payload.signature (base64url encoded)
 */
export function createMockJWT(overrides?: {
  cid?: string
  exp?: number
  usr?: string
}): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    cid: overrides?.cid || 'test-client-id',
    exp: overrides?.exp || Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    usr: overrides?.usr || 'test-user-id',
    usrtype: 'buyer',
  }
  
  // Base64url encode (simplified for testing)
  const base64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  
  const encodedHeader = base64url(header)
  const encodedPayload = base64url(payload)
  const signature = 'mock-signature'
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export interface MockResponseInit {
  status?: number
  statusText?: string
  headers?: Record<string, string>
  ok?: boolean
}

/**
 * Creates a mock Response object
 */
export function createMockResponse(
  body: any,
  init: MockResponseInit = {}
): Response {
  const status = init.status ?? 200
  const ok = init.ok ?? (status >= 200 && status < 300)

  const response = ({
    ok,
    status,
    statusText: init.statusText ?? (ok ? 'OK' : 'Error'),
    headers: new Headers(
      init.headers ?? { 'Content-Type': 'application/json' }
    ),
    json: jest.fn(() => Promise.resolve(body)),
    text: jest.fn(() => Promise.resolve(JSON.stringify(body))),
    blob: jest.fn(() => Promise.resolve(new Blob())),
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    formData: jest.fn(() => Promise.resolve(new FormData())),
    clone: jest.fn(function(this: Response) {
      return this
    }),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as unknown) as Response

  return response
}

/**
 * Creates a mock fetch function that returns successful responses
 */
export function createMockFetch(
  responseBody: any = {},
  init?: MockResponseInit
) {
  return jest.fn(() => Promise.resolve(createMockResponse(responseBody, init)))
}

/**
 * Creates a mock fetch function that rejects
 */
export function createMockFetchError(error: Error) {
  return jest.fn(() => Promise.reject(error))
}

/**
 * Creates a mock fetch function that returns an error response
 */
export function createMockFetchErrorResponse(
  errorBody: any,
  status: number = 400
) {
  return jest.fn(() =>
    Promise.resolve(
      createMockResponse(errorBody, {
        status,
        ok: false,
        statusText: 'Bad Request',
      })
    )
  )
}

/**
 * Default mock fetch instance
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockFetch = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
  Promise.resolve(createMockResponse({}))
) as jest.MockedFunction<typeof fetch>

// Set up global.fetch mock
global.fetch = mockFetch

export default mockFetch

/**
 * Helper to reset and configure mock fetch for a test
 */
export function setupMockFetch(
  responseBody: any = {},
  responseInit?: MockResponseInit
) {
  // If responseBody has an access_token and it's the mock value, replace with valid JWT
  if (responseBody.access_token && typeof responseBody.access_token === 'string') {
    if (responseBody.access_token === 'mock-token' || !responseBody.access_token.includes('.')) {
      responseBody = {
        ...responseBody,
        access_token: createMockJWT(),
        refresh_token: responseBody.refresh_token === 'mock-refresh-token' 
          ? createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 })
          : responseBody.refresh_token
      }
    }
  }
  
  mockFetch.mockClear()
  mockFetch.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve(createMockResponse(responseBody, responseInit))
  )
  return mockFetch
}

/**
 * Helper to verify fetch was called with expected parameters
 */
export function expectFetchCalledWith(url: string, options?: RequestInit) {
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining(url),
    expect.objectContaining(options ?? {})
  )
}

/**
 * Helper to get the request body from a fetch call
 */
export function getFetchCallBody(callIndex: number = 0): any {
  const call = mockFetch.mock.calls[callIndex]
  if (!call) return null

  const options = call[1] as RequestInit
  return options?.body
}

/**
 * Helper to get the request headers from a fetch call
 */
export function getFetchCallHeaders(
  callIndex: number = 0
): HeadersInit | undefined {
  const call = mockFetch.mock.calls[callIndex]
  if (!call) return undefined

  const options = call[1] as RequestInit
  return options?.headers
}
