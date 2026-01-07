/* eslint-disable no-var */
import { NativeDataFetcher } from '../core/NativeDataFetcher'
import { CancelToken } from '../core/types'
import { AccessToken } from '../models/AccessToken'
import Configuration from '../configuration'
import { ApiRole } from '../models/ApiRole'
import paramsSerializer from '../utils/paramsSerializer'
import { RequiredDeep } from '../models/RequiredDeep'
import OrderCloudError from '../utils/OrderCloudError'

class Auth {
  private fetcher: NativeDataFetcher | null = null

  constructor() {
    /**
     * @ignore
     * not part of public api, don't include in generated docs
     */
    this.Anonymous = this.Anonymous.bind(this)
    this.ClientCredentials = this.ClientCredentials.bind(this)
    this.ElevatedLogin = this.ElevatedLogin.bind(this)
    this.Login = this.Login.bind(this)
    this.RefreshToken = this.RefreshToken.bind(this)
    this._initializeFetcher = this._initializeFetcher.bind(this)
    this._makeOAuthRequest = this._makeOAuthRequest.bind(this)
  }

  private _initializeFetcher(): NativeDataFetcher {
    if (!this.fetcher) {
      const configuration = Configuration.Get()
      this.fetcher = new NativeDataFetcher({
        baseURL: configuration.baseApiUrl || 'https://api.ordercloud.io',
        timeout: configuration.timeoutInMilliseconds,
        fetchImplementation: configuration.fetchImplementation,
      })
    }
    return this.fetcher
  }

  private async _makeOAuthRequest(
    body: Record<string, any>,
    requestOptions: { cancelToken?: CancelToken; requestType?: string } = {}
  ): Promise<RequiredDeep<AccessToken>> {
    const fetcher = this._initializeFetcher()
    const formBody = paramsSerializer.serialize(body)

    try {
      const response = await fetcher.post<RequiredDeep<AccessToken>>(
        '/oauth/token',
        formBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          signal: requestOptions.cancelToken?.signal,
        }
      )
      return response
    } catch (e) {
      if (e instanceof Response || (e as any)?.response) {
        throw new OrderCloudError(e)
      }
      throw e
    }
  }

  /**
   * @description this workflow is most appropriate for client apps where user is a human, ie a registered user
   *
   * @param username of the user logging in
   * @param password of the user logging in
   * @param client_id of the application the user is logging into
   * @param scope optional roles being requested, if omitted will return all assigned roles
   * @param customRoles optional custom roles being requested - string array
   * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
   */
  public async Login(
    username: string,
    password: string,
    clientID: string,
    scope?: ApiRole[],
    customRoles?: string[],
    requestOptions: {
      cancelToken?: CancelToken
      requestType?: string
    } = {}
  ): Promise<RequiredDeep<AccessToken>> {
    if (scope && !Array.isArray(scope)) {
      throw new Error('scope must be a string array')
    }
    if (customRoles != null && !Array.isArray(customRoles)) {
      throw new Error('custom roles must be defined as a string array')
    }

    let _scope: string | undefined
    if (scope?.length && !customRoles?.length) {
      _scope = scope.join(' ')
    } else if (!scope?.length && customRoles?.length) {
      _scope += ` ${customRoles.join(' ')}`
    } else if (scope?.length && customRoles?.length) {
      _scope = `${scope.join(' ')} ${customRoles.join(' ')}`
    }

    const body = {
      grant_type: 'password',
      username,
      password,
      client_id: clientID,
      scope: _scope,
    }
    return this._makeOAuthRequest(body, requestOptions)
  }

  /**
   * @description similar to login except client secret is also required, adding another level of security
   *
   * @param clientSecret of the application
   * @param username of the user logging in
   * @param password of the user logging in
   * @param clientID of the application the user is logging into
   * @param scope roles being requested - space delimited string or array
   * @param customRoles optional custom roles being requested - string array
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
   */
  public async ElevatedLogin(
    clientSecret: string,
    username: string,
    password: string,
    clientID: string,
    scope?: ApiRole[],
    customRoles?: string[],
    requestOptions: {
      cancelToken?: CancelToken
      requestType?: string
    } = {}
  ): Promise<RequiredDeep<AccessToken>> {
    if (scope && !Array.isArray(scope)) {
      throw new Error('scope must be a string array')
    }
    if (customRoles != null && !Array.isArray(customRoles)) {
      throw new Error('custom roles must be defined as a string array')
    }

    let _scope: string | undefined
    if (scope?.length && !customRoles?.length) {
      _scope = scope.join(' ')
    } else if (!scope?.length && customRoles?.length) {
      _scope += ` ${customRoles.join(' ')}`
    } else if (scope?.length && customRoles?.length) {
      _scope = `${scope.join(' ')} ${customRoles.join(' ')}`
    }

    const body = {
      grant_type: 'password',
      scope: _scope,
      client_id: clientID,
      username,
      password,
      client_secret: clientSecret,
    }
    return this._makeOAuthRequest(body, requestOptions)
  }

  /**
   * @description this workflow is best suited for a backend system
   *
   * @param clientSecret of the application
   * @param clientID of the application the user is logging into
   * @param scope roles being requested - space delimited string or array
   * @param customRoles optional custom roles being requested - string array
   * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
   * @param reportProgress flag to report request and response progress.
   * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
   */
  public async ClientCredentials(
    clientSecret: string,
    clientID: string,
    scope?: ApiRole[],
    customRoles?: string[],
    requestOptions: {
      cancelToken?: CancelToken
      requestType?: string
    } = {}
  ): Promise<RequiredDeep<AccessToken>> {
    if (scope && !Array.isArray(scope)) {
      throw new Error('scope must be a string array')
    }
    if (customRoles != null && !Array.isArray(customRoles)) {
      throw new Error('custom roles must be defined as a string array')
    }

    let _scope: string | undefined
    if (scope?.length && !customRoles?.length) {
      _scope = scope.join(' ')
    } else if (!scope?.length && customRoles?.length) {
      _scope += ` ${customRoles.join(' ')}`
    } else if (scope?.length && customRoles?.length) {
      _scope = `${scope.join(' ')} ${customRoles.join(' ')}`
    }

    const body = {
      grant_type: 'client_credentials',
      scope: _scope,
      client_id: clientID,
      client_secret: clientSecret,
    }
    return this._makeOAuthRequest(body, requestOptions)
  }

  /**
   * @description extend your users' session by getting a new access token with a refresh token. refresh tokens must be enabled in the dashboard
   *
   * @param refreshToken of the application
   * @param clientID of the application the user is logging into
   * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
   */
  public async RefreshToken(
    refreshToken: string,
    clientID: string,
    requestOptions: {
      cancelToken?: CancelToken
      requestType?: string
    } = {}
  ): Promise<RequiredDeep<AccessToken>> {
    const body = {
      grant_type: 'refresh_token',
      client_id: clientID,
      refresh_token: refreshToken,
    }
    return this._makeOAuthRequest(body, requestOptions)
  }

  /**
   * @description allow users to browse your catalog without signing in - must have anonymous template user set in dashboard
   *
   * @param clientID of the application the user is logging into
   * @param scope roles being requested - space delimited string or array
   * @param customRoles optional custom roles being requested - string array
   * @param requestOptions.anonuserid Provide an externally generated id to track this user session, used specifically for the tracking events feature for integrating with Send and Discover
   * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
   */
  public async Anonymous(
    clientID: string,
    scope?: ApiRole[],
    customRoles?: string[],
    requestOptions: {
      anonuserid?: string
      cancelToken?: CancelToken
      requestType?: string
    } = {}
  ): Promise<RequiredDeep<AccessToken>> {
    if (scope && !Array.isArray(scope)) {
      throw new Error('scope must be a string array')
    }
    if (customRoles != null && !Array.isArray(customRoles)) {
      throw new Error('custom roles must be defined as a string array')
    }

    let _scope: string | undefined
    if (scope?.length && !customRoles?.length) {
      _scope = scope.join(' ')
    } else if (!scope?.length && customRoles?.length) {
      _scope += ` ${customRoles.join(' ')}`
    } else if (scope?.length && customRoles?.length) {
      _scope = `${scope.join(' ')} ${customRoles.join(' ')}`
    }

    const body = {
      grant_type: 'client_credentials',
      client_id: clientID,
      scope: _scope,
    }
    if (requestOptions.anonuserid) {
      ;(body as any)['anonuserid'] = requestOptions.anonuserid
      delete requestOptions['anonuserid']
    }
    return this._makeOAuthRequest(body, requestOptions)
  }
}

export default new Auth()
