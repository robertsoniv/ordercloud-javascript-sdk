import { IdentityToken } from '../models/IdentityToken'
import { RequiredDeep } from '../models/RequiredDeep'
import { RequestOptions } from '../models/RequestOptions'
import HttpClient from '../utils/HttpClient'
import OrderCloudError from '../utils/OrderCloudError'

export default class UserInfo {
  private impersonating: boolean = false
  private readonly http: HttpClient

  /**
   * @ignore
   * not part of public api, don't include in generated docs
   */
  constructor(http: HttpClient) {
    this.http = http
    this.GetToken = this.GetToken.bind(this)
  }

  /**
   * Get the identity token for an OrderCloud user. Used for Discover 2 integration.
   *
   * @param requestOptions.accessToken Provide an alternative token to the one stored in the sdk instance (useful for impersonation).
   * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
   */
  public async GetToken(
    requestOptions: RequestOptions = {}
  ): Promise<RequiredDeep<IdentityToken>> {
    const impersonating = this.impersonating
    this.impersonating = false
    return await this.http
      .get(`oauth/userinfo`, {
        ...requestOptions,
        impersonating,
      })
      .catch(ex => {
        // If it's already an OrderCloudError from HttpClient, just re-throw
        if (ex.isOrderCloudError) {
          throw ex
        }
        // Legacy support: if it has .response but isn't OrderCloudError yet
        if (ex.response) {
          throw new OrderCloudError(ex)
        }
        throw ex
      })
  }

  /**
   * @description
   * enables impersonation by calling the subsequent method with the stored impersonation token
   *
   * @example
   * UserInfo.As().Get() // Gets userinfo token for the impersonated users' token
   */
  public As(): this {
    this.impersonating = true
    return this
  }
}
