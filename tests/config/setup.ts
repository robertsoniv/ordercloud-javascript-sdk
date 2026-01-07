/**
 * Jest setup file for providing fetch API polyfills
 */

// Import the fetch mock to ensure it's set up before any tests run
import '../__mocks__/fetch'

// Ensure Response is available in the test environment
if (typeof global.Response === 'undefined') {
  // Create a minimal Response polyfill for jsdom
  global.Response = class Response {
    ok: boolean
    status: number
    statusText: string
    headers: Headers
    body: any
    bodyUsed: boolean
    redirected: boolean
    type: ResponseType
    url: string

    constructor(body?: any, init?: ResponseInit) {
      const status = init?.status ?? 200
      this.ok = status >= 200 && status < 300
      this.status = status
      this.statusText = init?.statusText ?? (this.ok ? 'OK' : 'Error')
      this.headers = new Headers(init?.headers)
      this.body = body
      this.bodyUsed = false
      this.redirected = false
      this.type = 'basic' as ResponseType
      this.url = ''
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }

    async text() {
      return typeof this.body === 'string'
        ? this.body
        : JSON.stringify(this.body)
    }

    async blob() {
      return new Blob()
    }

    async arrayBuffer() {
      return new ArrayBuffer(0)
    }

    async formData() {
      return new FormData()
    }

    clone() {
      return this
    }
  } as any
}

// Ensure Headers is available
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private map: Map<string, string> = new Map()

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.map.set(key.toLowerCase(), value))
        } else if (init instanceof Headers) {
          ;(init as any).map.forEach((value: string, key: string) => {
            this.map.set(key, value)
          })
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this.map.set(key.toLowerCase(), value)
          })
        }
      }
    }

    append(name: string, value: string) {
      this.map.set(name.toLowerCase(), value)
    }

    delete(name: string) {
      this.map.delete(name.toLowerCase())
    }

    get(name: string) {
      return this.map.get(name.toLowerCase()) ?? null
    }

    has(name: string) {
      return this.map.has(name.toLowerCase())
    }

    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value)
    }

    forEach(callback: (value: string, key: string, parent: Headers) => void) {
      this.map.forEach((value, key) => callback(value, key, this))
    }
  } as any
}

// Export for module use
export {}
