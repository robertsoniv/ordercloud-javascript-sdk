/**
 * Configuration options for OrderCloudClient
 */
export interface OrderCloudClientConfig {
  /**
   * Base URL for the OrderCloud API
   * @default 'https://api.ordercloud.io'
   */
  baseApiUrl: string

  /**
   * Client ID for authentication
   */
  clientID: string

  /**
   * API version to use
   * @default 'v1'
   */
  apiVersion: string

  /**
   * Options for cookie-based token storage
   */
  cookieOptions?: {
    prefix?: string
    domain?: string
    path?: string
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    maxAge?: number
  }

  /**
   * Default timeout for requests in milliseconds
   */
  timeout?: number
}
