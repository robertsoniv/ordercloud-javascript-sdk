import { CancelToken } from '../core/types'

export interface RequestOptions {
  /**
   * Alternative token to the one stored in the sdk instance (useful for impersonation).
   */
  accessToken?: string

  /**
   * Cancel token that can be used to cancel the request. Create using `AbortManager.createCancelToken()`.
   */
  cancelToken?: CancelToken

  /**
   * Identify the type of request. Useful for error logs.
   */
  requestType?: string
}
