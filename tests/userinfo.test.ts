import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { UserInfo, Tokens } from '../src/index'
import { makeToken } from './utils'

beforeEach(() => {
  setupMockFetch({ sub: 'test-user', cid: 'test-client' })
})

afterEach(() => {
  // cleans up any tracked calls before the next test
  jest.clearAllMocks()
})

test('handles auth userinfo', async () => {
  const validToken = makeToken()
  Tokens.SetAccessToken(validToken)
  await UserInfo.GetToken()

  expect(mockFetch).toHaveBeenCalledTimes(1)
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain('https://api.ordercloud.io/oauth/userinfo')
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})
