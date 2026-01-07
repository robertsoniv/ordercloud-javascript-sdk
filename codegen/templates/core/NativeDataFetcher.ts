import { FetcherConfig, RequestConfig } from './types'
import { InterceptorContainer } from './InterceptorManager'
import { AbortManager, CancelError } from './AbortManager'

/**
 * Native fetch-based HTTP client for OrderCloud SDK
 */
export class NativeDataFetcher {
  private config: Required<FetcherConfig>
  public interceptors: InterceptorContainer
  private fetchImpl: typeof fetch

  constructor(config: FetcherConfig) {
    this.config = {
      baseURL: config.baseURL,
      timeout: config.timeout ?? 60000,
      headers: config.headers ?? {},
      retry: config.retry ?? {
        maxRetries: 0,
        retryDelay: 1000,
      },
      fetchImplementation:
        config.fetchImplementation ??
        (typeof global !== 'undefined' && global.fetch
          ? global.fetch.bind(global)
          : typeof window !== 'undefined' && window.fetch
          ? window.fetch.bind(window)
          : ((() => {
              throw new Error(
                'Fetch is not available. Please provide a fetch implementation or use Node.js 18+.'
              )
            }) as any)),
    }

    this.interceptors = new InterceptorContainer()

    // Use custom fetch implementation or global fetch
    this.fetchImpl = this.config.fetchImplementation
    if (!this.fetchImpl) {
      throw new Error(
        'Fetch is not available. Please provide a fetch implementation or use Node.js 18+.'
      )
    }
  }

  /**
   * Performs a GET request
   */
  public async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' })
  }

  /**
   * Performs a POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', body: data })
  }

  /**
   * Performs a PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data })
  }

  /**
   * Performs a PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data })
  }

  /**
   * Performs a DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }

  /**
   * Main request method
   */
  private async request<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    let requestConfig = { ...config }

    // Execute request interceptors
    try {
      requestConfig = await this.interceptors.request.executeFulfilled(
        requestConfig
      )
    } catch (error) {
      return this.interceptors.request.executeRejected(error)
    }

    // Build full URL
    const fullUrl = this.buildUrl(url, requestConfig.params)

    // Build fetch options
    const fetchOptions = await this.buildFetchOptions(requestConfig)

    // Execute request with retry logic
    const response = await this.executeWithRetry(fullUrl, fetchOptions)

    // Execute response interceptors
    let finalResponse: Response
    try {
      finalResponse = await this.interceptors.response.executeFulfilled(
        response
      )
    } catch (error) {
      return this.interceptors.response.executeRejected(error)
    }

    // Parse and return response data
    return this.parseResponse<T>(finalResponse)
  }

  /**
   * Builds the full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    const baseUrl = this.config.baseURL.endsWith('/')
      ? this.config.baseURL.slice(0, -1)
      : this.config.baseURL

    const fullPath = path.startsWith('/') ? path : `/${path}`
    let url = `${baseUrl}${fullPath}`

    if (params && Object.keys(params).length > 0) {
      const queryString = this.serializeParams(params)
      url += `?${queryString}`
    }

    return url
  }

  /**
   * Serializes query parameters
   */
  private serializeParams(params: Record<string, any>): string {
    const parts: string[] = []

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return
      }

      if (Array.isArray(value)) {
        value.forEach(v => {
          parts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`
          )
        })
      } else if (typeof value === 'object') {
        // Flatten nested objects (for filters)
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue !== null && subValue !== undefined) {
            parts.push(
              `${encodeURIComponent(key)}.${encodeURIComponent(
                subKey
              )}=${encodeURIComponent(String(subValue))}`
            )
          }
        })
      } else {
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        )
      }
    })

    return parts.join('&')
  }

  /**
   * Builds fetch options from request config
   */
  private async buildFetchOptions(config: RequestConfig): Promise<RequestInit> {
    const headers = new Headers(this.config.headers)

    // Merge request headers
    if (config.headers) {
      const configHeaders = new Headers(config.headers)
      configHeaders.forEach((value, key) => {
        headers.set(key, value)
      })
    }

    // Serialize body if needed
    let body: any = config.body
    if (body !== undefined && body !== null) {
      if (
        typeof body === 'object' &&
        !(body instanceof FormData) &&
        !(body instanceof Blob)
      ) {
        body = JSON.stringify(body)
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json')
        }
      }
    }

    // Handle timeout
    const timeout = config.timeout ?? this.config.timeout
    const timeoutSignal = timeout
      ? AbortManager.createTimeoutSignal(timeout)
      : undefined

    // Combine signals if both timeout and cancel signal exist
    const signal = AbortManager.combineSignals(timeoutSignal, config.signal)

    return {
      method: config.method ?? 'GET',
      headers,
      body,
      signal,
    }
  }

  /**
   * Executes request with retry logic
   */
  private async executeWithRetry(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const maxRetries = this.config.retry.maxRetries
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchImpl(url, options)

        // Check if response should be retried
        if (
          attempt < maxRetries &&
          this.config.retry.retryCondition &&
          this.config.retry.retryCondition(response)
        ) {
          await this.delay(this.config.retry.retryDelay * (attempt + 1))
          continue
        }

        return response
      } catch (error) {
        lastError = error

        // Don't retry on abort/cancel
        if (
          AbortManager.isCancel(error) ||
          (error as any)?.name === 'AbortError'
        ) {
          throw new CancelError((error as any)?.message)
        }

        // Don't retry if this was the last attempt
        if (attempt >= maxRetries) {
          break
        }

        // Check if error should be retried
        if (
          this.config.retry.retryCondition &&
          !this.config.retry.retryCondition(error)
        ) {
          break
        }

        // Wait before retrying
        await this.delay(this.config.retry.retryDelay * (attempt + 1))
      }
    }

    throw lastError
  }

  /**
   * Parses the response and extracts data
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    // Check for error status codes
    if (!response.ok) {
      // Let the error be handled by response interceptors or caller
      throw response
    }

    const contentType = response.headers.get('content-type')

    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    // For non-JSON responses, return the response itself
    // The caller can handle it appropriately
    return response as any
  }

  /**
   * Delays execution for the specified time
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Updates the base configuration
   */
  public updateConfig(updates: Partial<FetcherConfig>): void {
    this.config = { ...this.config, ...updates }
  }
}
