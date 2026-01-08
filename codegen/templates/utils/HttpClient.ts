import { NativeDataFetcher } from '../core/NativeDataFetcher'
import { RequestConfig } from '../core/types'
import tokenService from '../api/Tokens'
import Configuration from '../configuration'
import { parseErrorResponse } from './parseErrorResponse'
import OrderCloudError from './OrderCloudError'

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */

interface OcRequestConfig extends RequestConfig {
  impersonating?: boolean
  accessToken?: string
  cancelToken?: any // For backward compatibility, mapped to signal
}

class HttpClient {
  private fetcher: NativeDataFetcher | null = null

  constructor() {
    this.get = this.get.bind(this)
    this.put = this.put.bind(this)
    this.post = this.post.bind(this)
    this.patch = this.patch.bind(this)
    this.delete = this.delete.bind(this)
    this._resolveToken = this._resolveToken.bind(this)
    this._buildRequestConfig = this._buildRequestConfig.bind(this)
    this._addTokenToConfig = this._addTokenToConfig.bind(this)
    this._initializeFetcher = this._initializeFetcher.bind(this)
  }

  private _initializeFetcher(): NativeDataFetcher {
    if (!this.fetcher) {
      const sdkConfig = Configuration.Get()
      this.fetcher = new NativeDataFetcher({
        baseURL: sdkConfig.baseApiUrl || 'https://api.ordercloud.io',
        timeout: sdkConfig.timeoutInMilliseconds,
        fetchImplementation: sdkConfig.fetchImplementation,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      // Use the shared interceptor container from Configuration
      this.fetcher.interceptors = Configuration.interceptors
    }
    return this.fetcher
  }

  public get = async (path: string, config?: OcRequestConfig): Promise<any> => {
    return await this.makeApiCall('GET', path, config)
  }

  public post = async (
    path: string,
    config?: OcRequestConfig
  ): Promise<any> => {
    return await this.makeApiCall('POST', path, config)
  }

  public put = async (path: string, config?: OcRequestConfig): Promise<any> => {
    return await this.makeApiCall('PUT', path, config)
  }

  public patch = async (
    path: string,
    config?: OcRequestConfig
  ): Promise<any> => {
    return await this.makeApiCall('PATCH', path, config)
  }

  public delete = async (path: string, config: OcRequestConfig) => {
    return await this.makeApiCall('DELETE', path, config)
  }

  private async makeApiCall(
    verb: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    config?: OcRequestConfig
  ) {
    const fetcher = this._initializeFetcher()
    const requestConfig = await this._buildRequestConfig(config)

    // oauth endpoints unlike the rest don't have /{apiVersion}/ appended to them
    const fullPath = path.includes('oauth/')
      ? `/${path}`
      : `/${Configuration.Get().apiVersion}${path}`

    // Build request with proper body handling
    const requestOptions: RequestConfig = {
      method: verb,
      headers: requestConfig.headers,
      params: requestConfig.params,
      signal: requestConfig.signal,
      timeout: requestConfig.timeout,
    }

    if (verb === 'PUT' || verb === 'POST' || verb === 'PATCH') {
      requestOptions.body = requestConfig.body
    }

    // Make the request using the appropriate method
    let response: any
    try {
      if (verb === 'GET') {
        response = await fetcher.get(fullPath, requestOptions)
      } else if (verb === 'POST') {
        response = await fetcher.post(
          fullPath,
          requestOptions.body,
          requestOptions
        )
      } else if (verb === 'PUT') {
        response = await fetcher.put(
          fullPath,
          requestOptions.body,
          requestOptions
        )
      } else if (verb === 'PATCH') {
        response = await fetcher.patch(
          fullPath,
          requestOptions.body,
          requestOptions
        )
      } else if (verb === 'DELETE') {
        response = await fetcher.delete(fullPath, requestOptions)
      }

      return response
    } catch (error) {
      // Convert Response errors to OrderCloudError
      // Check for Response-like object (supports both real Response and mocks)
      if (
        error &&
        typeof error.status === 'number' &&
        typeof error.ok === 'boolean'
      ) {
        const errorWithData = await parseErrorResponse(error)
        throw new OrderCloudError(errorWithData)
      }
      throw error
    }
  }

  // sets the token on every outgoing request, will attempt to
  // refresh the token if the token is expired and there is a refresh token set
  private async _addTokenToConfig(
    config: OcRequestConfig
  ): Promise<OcRequestConfig> {
    const token = this._resolveToken(config)
    const validToken = await tokenService.GetValidToken(token)

    if (!config.headers) {
      config.headers = {}
    }

    // Handle both Headers object and plain object
    if (config.headers instanceof Headers) {
      config.headers.set('Authorization', `Bearer ${validToken}`)
    } else {
      ;(config.headers as Record<string, string>)[
        'Authorization'
      ] = `Bearer ${validToken}`
    }

    return config
  }

  private _resolveToken(config: OcRequestConfig): string {
    let token: string | undefined
    if (config['accessToken']) {
      token = config['accessToken']
    } else if (config['impersonating']) {
      token = tokenService.GetImpersonationToken()
    } else {
      token = tokenService.GetAccessToken()
    }

    // remove these custom parameters
    // we were storing on the config for simplicity
    delete config['accessToken']
    delete config['impersonating']
    return token || ''
  }

  private async _buildRequestConfig(
    config?: OcRequestConfig
  ): Promise<OcRequestConfig> {
    const sdkConfig = Configuration.Get()

    // Handle cancelToken for backward compatibility
    let signal = config?.signal
    if (
      config?.cancelToken &&
      typeof config.cancelToken.signal !== 'undefined'
    ) {
      signal = config.cancelToken.signal
    }

    const requestConfig: OcRequestConfig = {
      ...config,
      params: config?.params,
      body: config?.body,
      signal,
      timeout: config?.timeout || sdkConfig.timeoutInMilliseconds,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {}),
      },
    }

    // Clean up deprecated properties
    delete requestConfig.cancelToken

    return this._addTokenToConfig(requestConfig)
  }
}

export default new HttpClient()
