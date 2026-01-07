/**
 * Core types for the OrderCloud SDK fetch implementation
 */

/**
 * Configuration for the NativeDataFetcher
 */
export interface FetcherConfig {
  /** Base URL for all API requests */
  baseURL: string
  /** Default timeout in milliseconds */
  timeout?: number
  /** Default headers to include in all requests */
  headers?: Record<string, string>
  /** Retry configuration */
  retry?: RetryConfig
  /** Custom fetch implementation (for Node.js compatibility) */
  fetchImplementation?: typeof fetch
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number
  /** Initial delay between retries in milliseconds */
  retryDelay: number
  /** Function to determine if a request should be retried */
  retryCondition?: (error: any) => boolean
}

/**
 * Request configuration for individual requests
 */
export interface RequestConfig {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Request headers */
  headers?: HeadersInit
  /** Request body */
  body?: any
  /** Query parameters */
  params?: Record<string, any>
  /** Abort signal for cancellation */
  signal?: AbortSignal
  /** Request timeout (overrides global timeout) */
  timeout?: number
}

/**
 * Request interceptor function
 */
export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>

/**
 * Response interceptor function for successful responses
 */
export type ResponseInterceptor = (
  response: Response
) => Response | Promise<Response>

/**
 * Response interceptor function for errors
 */
export type ErrorInterceptor = (error: any) => any

/**
 * Interceptor tuple containing success and error handlers
 */
export interface InterceptorTuple<T, E> {
  fulfilled: T
  rejected?: E
}

/**
 * Cancel token interface for request cancellation
 */
export interface CancelToken {
  /** Cancels the request with an optional reason */
  cancel(reason?: string): void
  /** Returns true if the request has been cancelled */
  isCancelled(): boolean
  /** The AbortSignal for this cancel token */
  readonly signal: AbortSignal
}

/**
 * Fetcher response wrapper
 */
export interface FetcherResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}
