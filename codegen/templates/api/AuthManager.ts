import { Configuration } from '../configuration'
import { StorageKeyGenerator } from '../storage/StorageKeyGenerator'
import CookieService from '../utils/CookieService'
import parseJwt from '../utils/ParseJwt'

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */
const isNode =
  typeof process !== 'undefined' && Boolean(process?.versions?.node)

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */
const isEdgeRuntime =
  typeof process !== 'undefined' &&
  process?.env?.NEXT_RUNTIME &&
  process.env.NEXT_RUNTIME !== 'edge'

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */
const isServer = isNode || isEdgeRuntime

/**
 * Manages authentication tokens for an OrderCloud client instance
 * Each client instance has its own isolated token storage
 */
export class AuthManager {
  private readonly keyGenerator: StorageKeyGenerator
  private readonly cookieService: CookieService
  private readonly config: Configuration

  private accessTokenCookieName: string
  private impersonationTokenCookieName: string
  private refreshTokenCookieName: string
  private identityTokenCookieName: string
  private identityProviderAccessTokenCookieName: string

  // In-memory storage for server environments
  private accessToken?: string = null
  private impersonationToken?: string = null
  private refreshToken?: string = null
  private identityToken?: string = null
  private identityProviderAccessToken?: string = null

  // Auth instance will be set after construction to avoid circular dependency
  private authInstance: any = null

  /**
   * @ignore
   * not part of public api, don't include in generated docs
   */
  constructor(config: Configuration, cookieService: CookieService) {
    this.config = config
    this.cookieService = cookieService

    // Generate unique storage keys for this client instance
    const clientID = config.clientID || 'default'
    this.keyGenerator = new StorageKeyGenerator(clientID)

    // Generate unique cookie names
    const keys = this.keyGenerator.getAllKeys()
    this.accessTokenCookieName = keys.accessToken
    this.impersonationTokenCookieName = keys.impersonationToken
    this.refreshTokenCookieName = keys.refreshToken
    this.identityTokenCookieName = this.keyGenerator.generateKey(
      'identity_token'
    )
    this.identityProviderAccessTokenCookieName = this.keyGenerator.generateKey(
      'idp_access_token'
    )

    // Bind methods
    this.GetAccessToken = this.GetAccessToken.bind(this)
    this.GetImpersonationToken = this.GetImpersonationToken.bind(this)
    this.GetRefreshToken = this.GetRefreshToken.bind(this)
    this.RemoveAccessToken = this.RemoveAccessToken.bind(this)
    this.RemoveImpersonationToken = this.RemoveImpersonationToken.bind(this)
    this.SetAccessToken = this.SetAccessToken.bind(this)
    this.RemoveRefreshToken = this.RemoveRefreshToken.bind(this)
    this.SetImpersonationToken = this.SetImpersonationToken.bind(this)
    this.SetRefreshToken = this.SetRefreshToken.bind(this)
    this.RemoveIdentityToken = this.RemoveIdentityToken.bind(this)
    this.GetIdentityToken = this.GetIdentityToken.bind(this)
    this.SetIdentityToken = this.SetIdentityToken.bind(this)
    this._isTokenExpired = this._isTokenExpired.bind(this)
    this._tryRefreshToken = this._tryRefreshToken.bind(this)
  }

  /**
   * Set the Auth instance to enable token refresh
   * Called by Auth after construction to avoid circular dependency
   */
  public setAuthInstance(auth: any): void {
    this.authInstance = auth
  }

  /**
   * Manage Access Tokens
   */

  public GetAccessToken(): string | undefined {
    return isServer
      ? this.accessToken
      : this.cookieService.get(this.accessTokenCookieName)
  }

  public SetAccessToken(token: string): void {
    parseJwt(token) // check if token is valid
    isServer
      ? (this.accessToken = token)
      : this.cookieService.set(this.accessTokenCookieName, token)
  }

  public RemoveAccessToken(): void {
    isServer
      ? (this.accessToken = '')
      : this.cookieService.remove(this.accessTokenCookieName)
  }

  /**
   * Manage Impersonation Tokens
   */

  public GetImpersonationToken(): string | undefined {
    return isServer
      ? this.impersonationToken
      : this.cookieService.get(this.impersonationTokenCookieName)
  }

  public SetImpersonationToken(token: string): void {
    parseJwt(token) // check if token is valid
    isServer
      ? (this.impersonationToken = token)
      : this.cookieService.set(this.impersonationTokenCookieName, token)
  }

  public RemoveImpersonationToken(): void {
    isServer
      ? (this.impersonationToken = null)
      : this.cookieService.remove(this.impersonationTokenCookieName)
  }

  /**
   * Manage Refresh Tokens
   */

  public GetRefreshToken(): string | undefined {
    return isServer
      ? this.refreshToken
      : this.cookieService.get(this.refreshTokenCookieName)
  }

  public SetRefreshToken(token: string): void {
    isServer
      ? (this.refreshToken = token)
      : this.cookieService.set(this.refreshTokenCookieName, token)
  }

  public RemoveRefreshToken(): void {
    isServer
      ? (this.refreshToken = null)
      : this.cookieService.remove(this.refreshTokenCookieName)
  }

  /**
   * Manage Identity Tokens
   */

  public GetIdentityToken(): string | undefined {
    return isServer
      ? this.identityToken
      : this.cookieService.get(this.identityTokenCookieName)
  }

  public SetIdentityToken(token: string): void {
    isServer
      ? (this.identityToken = token)
      : this.cookieService.set(this.identityTokenCookieName, token)
  }

  public RemoveIdentityToken(): void {
    isServer
      ? (this.identityToken = null)
      : this.cookieService.remove(this.identityTokenCookieName)
  }

  /**
   * Manage Identity Provider Tokens
   */
  public GetIdpAccessToken(): string | undefined {
    return isServer
      ? this.identityProviderAccessToken
      : this.cookieService.get(this.identityProviderAccessTokenCookieName)
  }

  public SetIdpAccessToken(token: string): void {
    isServer
      ? (this.identityProviderAccessToken = token)
      : this.cookieService.set(
          this.identityProviderAccessTokenCookieName,
          token
        )
  }

  public RemoveIdpAccessToken(): void {
    isServer
      ? (this.identityProviderAccessToken = null)
      : this.cookieService.remove(this.identityProviderAccessTokenCookieName)
  }

  /**
   * If no token is provided will attempt to get and validate token
   * stored in sdk. If token is invalid or missing it will also attempt
   * to refresh the token if possible
   */
  public async GetValidToken(tokenToValidate?: string): Promise<string> {
    let token = tokenToValidate || this.GetAccessToken()
    if (this._isTokenExpired(token)) {
      token = await this._tryRefreshToken(token)
    }
    return Promise.resolve(token || '')
  }

  private _isTokenExpired(token: string): boolean {
    if (!token) {
      return true
    }
    const decodedToken = parseJwt(token)
    const currentSeconds = Date.now() / 1000
    const currentSecondsWithBuffer = currentSeconds - 10
    return decodedToken.exp < currentSecondsWithBuffer
  }

  private async _tryRefreshToken(accessToken: string): Promise<string> {
    const refreshToken = this.GetRefreshToken()
    if (!refreshToken) {
      return accessToken || ''
    }

    const sdkConfig = this.config.Get()
    if (!accessToken && !sdkConfig.clientID) {
      return accessToken || ''
    }

    // try to get clientid so we can make refresh request
    let clientID
    if (accessToken) {
      const decodedToken = parseJwt(accessToken)
      clientID = decodedToken.cid
    }
    if (sdkConfig.clientID) {
      clientID = sdkConfig.clientID
    }

    if (!clientID) {
      return ''
    }

    // Use Auth instance if available (set after construction)
    if (this.authInstance && clientID) {
      try {
        const refreshRequest = await this.authInstance.RefreshToken(
          refreshToken,
          clientID
        )
        const accessToken = refreshRequest.access_token
        this.SetAccessToken(accessToken)
        return accessToken
      } catch (e) {
        return ''
      }
    }

    return ''
  }
}
