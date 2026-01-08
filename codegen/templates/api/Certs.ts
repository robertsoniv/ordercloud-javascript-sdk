import { RequiredDeep } from '../models/RequiredDeep'
import { RequestOptions } from '../models/RequestOptions'
import HttpClient from '../utils/HttpClient'
import OrderCloudError from '../utils/OrderCloudError'
import { PublicKey } from '../models/PublicKey'

export default class Certs {
  private impersonating: boolean = false
  private readonly http: HttpClient

  /**
   * @ignore
   * not part of public api, don't include in generated docs
   */
  constructor(http: HttpClient) {
    this.http = http
    this.GetPublicKey = this.GetPublicKey.bind(this)
  }

  /**
   * Get a single cert public key. Returns a JSON Web Key (JWK). Can be used for validating the token was signed by OrderCloud.
   * Check out the {@link https://ordercloud.io/api-reference/authentication-and-authorization/certs/get-public-key|api docs} for more info
   *
   * @param ID ID of the public key.
   * @param requestOptions.accessToken Provide an alternative token to the one stored in the sdk instance (useful for impersonation).
   * @param requestOptions.cancelToken Provide a cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   * @param requestOptions.requestType Provide a value that can be used to identify the type of request. Useful for error logs.
   */
  public async GetPublicKey<TPublicKey extends PublicKey>(
    ID: string,
    requestOptions: RequestOptions = {}
  ): Promise<RequiredDeep<TPublicKey>> {
    const impersonating = this.impersonating
    this.impersonating = false
    return await this.http
      .get(`oauth/certs/${ID}`, { ...requestOptions, impersonating })
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
   * Certs.As().List() // lists Certs using the impersonated users' token
   */
  public As(): this {
    this.impersonating = true
    return this
  }
}
