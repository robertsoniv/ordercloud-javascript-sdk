import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { OrderCloudClient } from '../src'
import { makeToken } from './utils'

// endpoints that have oauth/ in path don't include /{apiVersion}/
const apiUrl = `https://api.ordercloud.io`
const validToken = makeToken()
const mockKid = 'x6sA-GfTGEWUp5OWFbhmmg'

let client: OrderCloudClient

beforeEach(() => {
  setupMockFetch({ key: 'mock-public-key' })
  client = new OrderCloudClient()
})

test('can get cert', async () => {
  await client.Certs.GetPublicKey(mockKid, { accessToken: validToken })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  
  expect(url).toContain(`${apiUrl}/oauth/certs/${mockKid}`)
  expect(options.method).toBe('GET')
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/json')
  expect(headers.get('Authorization')).toBe(`Bearer ${validToken}`)
})
