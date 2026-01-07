# Project Plan: OrderCloud JavaScript SDK Modernization

## 1. Project Overview

Comprehensively modernize the ordercloud-javascript-sdk by:
1. **Removing Axios** in favor of native Fetch API with a `NativeDataFetcher` (similar to Sitecore's content SDK)
2. **Introducing OrderCloudClient** as the unified entry point (similar to `SitecoreClient` nomenclature)
3. **Simplifying token storage** by eliminating user-configurable cookie/storage keys in favor of SDK-managed unique identifiers

This modernization reduces bundle size, eliminates external HTTP dependencies, simplifies developer experience, and prevents storage key conflicts while maintaining backward compatibility for critical features like interceptors and request cancellation.

## 2. Architecture Summary

**Core Components:**
- `OrderCloudClient` - Main entry point class (replaces current SDK initialization pattern)
- `NativeDataFetcher` - Fetch wrapper with error handling and retry logic
- `InterceptorManager` - Request/response transformation pipeline
- `AbortManager` - Cancellation token implementation using AbortController
- `TokenStorage` - Unified storage abstraction with SDK-managed keys
- `StorageKeyGenerator` - Generates unique storage keys from client configuration
- `StorageAdapter` - Platform-agnostic storage interface (cookies, localStorage, memory)
- Adapter layer for backward compatibility during migration period

**Key Design Decisions:**
- Unified `OrderCloudClient` interface (similar to `SitecoreClient` pattern)
- Use native `AbortController` for cancellation (browser & Node.js 15+)
- Implement interceptor pattern matching Axios API surface
- SDK-managed storage keys (no user configuration) using hashed client ID
- Auto-detect storage mechanism based on runtime environment
- Maintain current error handling structure
- Support both promise and async/await patterns

## 3. Technology Stack

- **Runtime:** Browser (ES2020+), Node.js 18+
- **Core APIs:** Fetch API, AbortController, Headers, URL
- **Build:** TypeScript 5.x
- **Testing:** Jest with fetch mocks (jest-fetch-mock or MSW)
- **Polyfills:** node-fetch for Node.js < 18 (dev dependency only)

## 4. Project Structure

```
ordercloud-javascript-sdk/
├── src/
│   ├── client/
│   │   ├── OrderCloudClient.ts        # Main client class (new entry point)
│   │   ├── OrderCloudClientConfig.ts  # Configuration interface
│   │   └── ClientFactory.ts           # Optional builder pattern
│   ├── core/
│   │   ├── NativeDataFetcher.ts       # Main fetch wrapper
│   │   ├── InterceptorManager.ts      # Request/response pipeline
│   │   ├── AbortManager.ts            # Cancellation support
│   │   ├── ErrorHandler.ts            # HTTP error mapping
│   │   └── types.ts                   # Core interfaces
│   ├── auth/
│   │   ├── AuthManager.ts             # Token lifecycle management
│   │   ├── TokenStorage.ts            # Storage abstraction layer
│   │   └── StorageKeyGenerator.ts     # Unique key generation
│   ├── storage/
│   │   ├── adapters/
│   │   │   ├── CookieAdapter.ts       # Browser cookie storage
│   │   │   ├── LocalStorageAdapter.ts # Browser localStorage
│   │   │   └── MemoryAdapter.ts       # In-memory (SSR, Node.js)
│   │   └── StorageAdapter.ts          # Storage interface
│   ├── api/
│   │   ├── resources/                 # API endpoints (Products, Orders, etc.)
│   │   ├── BaseApi.ts                 # Shared API logic
│   │   └── index.ts
│   ├── utils/
│   │   ├── request-builder.ts         # URL/query param construction
│   │   └── response-parser.ts         # JSON/blob handling
│   └── index.ts
├── tests/
│   ├── client/
│   │   └── OrderCloudClient.test.ts
│   ├── core/
│   │   ├── NativeDataFetcher.test.ts
│   │   ├── InterceptorManager.test.ts
│   │   └── AbortManager.test.ts
│   ├── storage/
│   │   ├── StorageKeyGenerator.test.ts
│   │   └── adapters.test.ts
│   └── integration/
│       └── checkout-flow.test.ts      # End-to-end tests
└── package.json
```

## 5. Implementation Steps

### Phase 1: Core Infrastructure (Week 1)

1. **Create OrderCloudClient class**
   - Main entry point with minimal configuration
   - Accept config: `baseApiUrl`, `clientId`, `scope` (optional)
   - Initialize internal components (fetcher, auth manager, storage)
   - Expose API resource properties: `client.Products`, `client.Orders`, etc.

2. **Implement StorageKeyGenerator**
   - Generate unique keys from `clientId` hash + environment
   - Pattern: `oc_${hash(clientId)}_${env}_${purpose}`
   - Example: `oc_a3f5d2_prod_access_token`
   - No user configuration required

3. **Build StorageAdapter interface**
   - Define storage contract: `get()`, `set()`, `remove()`, `clear()`
   - Implement `CookieAdapter` with secure defaults
   - Implement `LocalStorageAdapter` for fallback
   - Implement `MemoryAdapter` for SSR/Node.js
   - Auto-detect best adapter based on environment

4. **Create NativeDataFetcher class**
   - Accept config: `baseURL`, `headers`, `timeout`, `retryConfig`
   - Implement `fetch(url, options)` wrapper
   - Handle timeout using AbortSignal.timeout()
   - Map fetch errors to OrderCloud error format

5. **Build InterceptorManager**
   - Request interceptors: `(config) => config | Promise<config>`
   - Response interceptors: `(response) => response | Promise<response>`
   - Error interceptors: `(error) => throw error | Promise<any>`
   - Execute in FIFO order (requests) and LIFO (responses)

6. **Implement AbortManager**
   - Token interface: `{ cancel(reason), isCancelled(), signal }`
   - Factory method: `createCancelToken()`
   - Integration with AbortController
   - Cleanup logic for completed requests

### Phase 2: Authentication & Storage (Week 2)

7. **Create AuthManager**
   - Implement token lifecycle management
   - Use `TokenStorage` with auto-generated keys
   - Handle token refresh on 401 responses
   - Support multiple auth flows (password, client credentials, anonymous)

8. **Build TokenStorage class**
   - Integrate `StorageKeyGenerator` for unique keys
   - Use `StorageAdapter` for platform-agnostic storage
   - Store access token, refresh token, and metadata
   - Implement automatic token expiry checks

9. **Implement authentication methods on OrderCloudClient**
   - `client.login(username, password, clientSecret?)` - Password flow
   - `client.authenticate(clientSecret)` - Client credentials flow
   - `client.loginAsAnonymous()` - Anonymous user flow
   - `client.logout()` - Clear all SDK-managed storage
   - Auto-inject auth headers into all requests

10. **Request/Response transformation**
    - JSON stringification for request bodies
    - Automatic JSON parsing for responses
    - Blob handling for file downloads
    - Form data serialization

### Phase 3: API Resources Migration (Week 3)

11. **Migrate API resource methods**
    - Update each resource class (Products, Orders, Users, Buyers, etc.)
    - Replace `axios.get/post/put/delete` with NativeDataFetcher methods
    - Preserve TypeScript interfaces and generics
    - Update query parameter serialization

12. **Expose resources through OrderCloudClient**
    - Mount resources as properties: `client.Products`, `client.Orders`
    - Example: `await client.Products.List()`
    - Example: `await client.Orders.Get('orderID')`
    - Maintain fluent API design

13. **Interceptor implementation examples**
   ```typescript
   // Request interceptor
   client.interceptors.request.use(config => {
     config.headers.set('X-Custom-Header', 'value');
     return config;
   });

   // Response interceptor
   client.interceptors.response.use(
     response => response,
     error => {
       if (error.status === 401) {
         // Handle auth refresh
       }
       throw error;
     }
   );
   ```

14. **Cancellation token usage**
    ```typescript
    const token = client.createCancelToken();
    
    client.Products.List({ cancelToken: token })
      .catch(err => {
        if (client.isCancel(err)) {
          console.log('Request cancelled');
        }
      });
    
    // Cancel after 5s
    setTimeout(() => token.cancel('Timeout'), 5000);
    ```

15. **Timeout configuration**
    - Global timeout in SDK config
    - Per-request timeout override
    - Combine with AbortController

### Phase 4: Testing & Migration (Week 4)

16. **Unit tests**
    - Mock fetch using `jest.spyOn(global, 'fetch')`
    - Test all HTTP methods, headers, query params
    - Verify interceptor execution order
    - Test cancellation and timeout scenarios
    - Test storage key generation and uniqueness
    - Test storage adapter fallback logic

17. **Integration tests**
    - Full checkout flow with OrderCloudClient
    - Authentication token refresh and storage
    - Multi-client scenarios (different clientIds)
    - File upload/download
    - Batch operations
    - SSR/Node.js environment tests

18. **Deprecation path**
    - Add deprecation warnings for old SDK pattern
    - Detect and warn if old cookie configuration is used
    - Provide migration guide in docs
    - Consider adapter layer for gradual migration

### Phase 5: Documentation & Release (Week 5)

19. **Update documentation**
    - Migration guide from old SDK to OrderCloudClient
    - Migration guide from Axios patterns to Fetch
    - Storage key auto-generation explanation
    - Authentication flow examples
    - Interceptor examples
    - Cancellation token usage
    - Breaking changes list
    - Multi-environment setup guide

20. **Performance benchmarking**
    - Bundle size comparison (before/after Axios removal)
    - Request throughput tests
    - Memory usage analysis
    - Storage performance across adapters

21. **Release preparation**
    - Bump major version (breaking change)
    - Update CHANGELOG.md
    - Create migration checklist for consumers
    - Provide codemod/migration scripts where possible

## 6. Key Configuration

### NativeDataFetcher Config Interface
```typescript
interface FetcherConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryCondition?: (error: any) => boolean;
  };
}
```

### OrderCloudClient Initialization

**Minimal Setup:**
```typescript
const client = new OrderCloudClient({
  baseApiUrl: 'https://api.ordercloud.io/v1',
  clientId: 'YOUR_CLIENT_ID'
});
```

**With Optional Configuration:**
```typescript
const client = new OrderCloudClient({
  baseApiUrl: 'https://api.ordercloud.io/v1',
  clientId: 'YOUR_CLIENT_ID',
  scope: ['Shopper', 'MeAdmin'],
  timeout: 30000,
  cookieOptions: {
    secure: true,      // SDK defaults to true in production
    sameSite: 'strict' // SDK defaults to 'lax'
  },
  retryAttempts: 3
});
```

**Usage Examples:**
```typescript
// Authentication
await client.login('username', 'password');

// API calls
const products = await client.Products.List();
const order = await client.Orders.Get('ORDER123');

// Logout
await client.logout();
```

### Storage Key Auto-Generation
- **Pattern:** `oc_${hash(clientId)}_${environment}_${purpose}`
- **Example:** `oc_a3f5d2_prod_access_token`
- **Users never configure:** SDK handles all key management internally
- **Conflict prevention:** Hash ensures uniqueness per client/environment
- **Multi-client support:** Different clientIds get different storage keys
- **Purposes:** `access_token`, `refresh_token`, `user_context`, `impersonation`

### Breaking Changes to Document
- **Main class renamed:** `OrderCloudSDK` → `OrderCloudClient`
- **Cookie/storage configuration removed:** No more user-defined storage keys
- **Axios dependency removed:** All Axios-specific config options removed
- **API access pattern changed:** `Resources.Method()` → `client.Resources.Method()`
- **Auth methods consolidated:** Single interface through `OrderCloudClient`
- **Error shapes updated:** `isAxiosError` → `isOrderCloudError`
- **Node.js compatibility:** Requires Node.js 18+ (native fetch support)
- **Interceptor API:** Slight changes to match fetch-based implementation

### Backward Compatibility Considerations
- Provide adapter/shim for old SDK pattern during migration period
- Maintain similar error structure for easier migration
- Keep method signatures on API resources where possible
- Provide codemod/migration script for common patterns
- Add clear migration guide with side-by-side examples
- Consider deprecation warnings for 1-2 minor versions before removal

---

**Estimated Timeline:** 5 weeks  
**Risk Areas:** Node.js compatibility, consumer migration effort, edge case error handling
