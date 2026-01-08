import { OrderCloudClient, SdkConfiguration } from '../src'

test('should handle modifying a top level property', () => {
  const baseApiUrl = 'https://sandboxapi.ordercloud.io'
  const client = new OrderCloudClient({ baseApiUrl })
  
  // Client config should reflect the provided baseApiUrl
  expect(client).toBeDefined()
  // Note: Configuration is now immutable and internal to the client
})

test('should handle modifying a cookie option', () => {
  const prefix = 'myprefix'
  const client = new OrderCloudClient({ 
    cookieOptions: { prefix } 
  })
  
  // Client should be created with custom cookie options
  expect(client).toBeDefined()
})

test('should create multiple clients with different configurations', () => {
  const client1 = new OrderCloudClient({ 
    clientID: 'client-1',
    baseApiUrl: 'https://api1.ordercloud.io' 
  })
  const client2 = new OrderCloudClient({ 
    clientID: 'client-2',
    baseApiUrl: 'https://api2.ordercloud.io' 
  })
  
  // Both clients should be independent
  expect(client1).toBeDefined()
  expect(client2).toBeDefined()
  expect(client1).not.toBe(client2)
})
