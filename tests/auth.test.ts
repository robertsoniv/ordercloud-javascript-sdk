import mockFetch, { setupMockFetch } from './__mocks__/fetch'
import { OrderCloudClient, ApiRole } from '../src/index'

const testdata = {
  authUrl: 'https://api.ordercloud.io/oauth/token',
  username: '$crhistian', // handles special chars
  password: '87awesomesauce#$%^&', // handles special chars
  clientSecret: 'my-mock-secret',
  clientID: '12345678-1234-1C34-1234-6BAB2E6CB1F0',
  scope: ['BuyerAdmin', 'WebhookAdmin'] as ApiRole[],
  customRoles: ['InventoryAdmin'],
  authHeaders: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  },
}

let client: OrderCloudClient

beforeEach(() => {
  setupMockFetch({ access_token: 'mock-token', expires_in: 3600 })
  client = new OrderCloudClient({ clientID: testdata.clientID })
})

afterEach(() => {
  // cleans up any tracked calls before the next test
  jest.clearAllMocks()
})

const urlencode = encodeURIComponent
test('can auth with login, no custom roles', async () => {
  await client.Auth.Login(
    testdata.username,
    testdata.password,
    testdata.clientID,
    testdata.scope as ApiRole[]
  )
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=password&username=${urlencode(
    testdata.username
  )}&password=${urlencode(testdata.password)}&client_id=${
    testdata.clientID
  }&scope=${urlencode(testdata.scope.join(' '))}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth with login without scope or custom roles', async () => {
  await client.Auth.Login(testdata.username, testdata.password, testdata.clientID)
  expect(mockFetch).toHaveBeenCalledTimes(1)

  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=password&username=${urlencode(
    testdata.username
  )}&password=${urlencode(testdata.password)}&client_id=${testdata.clientID}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth with login with custom roles', async () => {
  await client.Auth.Login(
    testdata.username,
    testdata.password,
    testdata.clientID,
    testdata.scope as ApiRole[],
    testdata.customRoles
  )
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=password&username=${urlencode(
    testdata.username
  )}&password=${urlencode(testdata.password)}&client_id=${
    testdata.clientID
  }&scope=${urlencode(
    `${testdata.scope.join(' ')} ${testdata.customRoles?.join?.(' ')}`
  )}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth with elevated login, no custom roles', async () => {
  await client.Auth.ElevatedLogin(
    testdata.clientSecret,
    testdata.username,
    testdata.password,
    testdata.clientID,
    testdata.scope
  )
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=password&scope=${urlencode(
    testdata.scope.join(' ')
  )}&client_id=${testdata.clientID}&username=${urlencode(
    testdata.username
  )}&password=${urlencode(testdata.password)}&client_secret=${urlencode(
    testdata.clientSecret
  )}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth with elevated login with custom roles', async () => {
  await client.Auth.ElevatedLogin(
    testdata.clientSecret,
    testdata.username,
    testdata.password,
    testdata.clientID,
    testdata.scope,
    testdata.customRoles
  )
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=password&scope=${urlencode(
    `${testdata.scope.join(' ')} ${testdata.customRoles?.join?.(' ')}`
  )}&client_id=${testdata.clientID}&username=${urlencode(
    testdata.username
  )}&password=${urlencode(testdata.password)}&client_secret=${urlencode(
    testdata.clientSecret
  )}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth with client credentials, no custom roles', async () => {
  await client.Auth.ClientCredentials(
    testdata.clientSecret,
    testdata.clientID,
    testdata.scope as ApiRole[]
  )
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=client_credentials&scope=${urlencode(
    testdata.scope.join(' ')
  )}&client_id=${testdata.clientID}&client_secret=${testdata.clientSecret}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth with client credentials with custom roles', async () => {
  await client.Auth.ClientCredentials(
    testdata.clientSecret,
    testdata.clientID,
    testdata.scope as ApiRole[],
    testdata.customRoles
  )
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=client_credentials&scope=${urlencode(
    `${testdata.scope.join(' ')} ${testdata.customRoles?.join?.(' ')}`
  )}&client_id=${testdata.clientID}&client_secret=${testdata.clientSecret}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth with refresh token', async () => {
  const refreshToken = 'mock-refresh-token'
  await client.Auth.RefreshToken(refreshToken, testdata.clientID)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  
  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=refresh_token&client_id=${testdata.clientID}&refresh_token=${refreshToken}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth anonymous, no custom roles', async () => {
  await client.Auth.Anonymous(testdata.clientID, testdata.scope)
  expect(mockFetch).toHaveBeenCalledTimes(1)

  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=client_credentials&client_id=${
    testdata.clientID
  }&scope=${urlencode(testdata.scope.join(' '))}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('handles auth anonymous with anonuserid', async () => {
  await client.Auth.Anonymous(testdata.clientID, testdata.scope, undefined, {
    anonuserid: 'myanonuserid',
  })

  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=client_credentials&client_id=${
    testdata.clientID
  }&scope=${urlencode(testdata.scope.join(' '))}&anonuserid=myanonuserid`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})

test('can auth anonymous with custom roles', async () => {
  await client.Auth.Anonymous(testdata.clientID, testdata.scope, testdata.customRoles)
  expect(mockFetch).toHaveBeenCalledTimes(1)

  const call = mockFetch.mock.calls[0]
  const url = call[0] as string
  const options = call[1] as RequestInit
  const body = `grant_type=client_credentials&client_id=${
    testdata.clientID
  }&scope=${urlencode(
    `${testdata.scope.join(' ')} ${testdata.customRoles?.join?.(' ')}`
  )}`
  
  expect(url).toBe(testdata.authUrl)
  expect(options.method).toBe('POST')
  expect(options.body).toBe(body)
  const headers = options.headers as Headers
  expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
  expect(headers.get('Accept')).toBe('application/json')
})
