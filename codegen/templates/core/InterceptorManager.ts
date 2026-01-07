import {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorTuple,
} from './types'

/**
 * Manages request and response interceptors
 */
export class InterceptorManager<
  T extends (...args: any[]) => any,
  E extends (...args: any[]) => any = any
> {
  private interceptors: Array<InterceptorTuple<T, E> | null> = []

  /**
   * Adds a new interceptor
   * @param fulfilled Success handler
   * @param rejected Error handler
   * @returns Interceptor ID for later removal
   */
  public use(fulfilled: T, rejected?: E): number {
    this.interceptors.push({ fulfilled, rejected })
    return this.interceptors.length - 1
  }

  /**
   * Removes an interceptor by ID
   * @param id Interceptor ID returned from use()
   */
  public eject(id: number): void {
    if (this.interceptors[id]) {
      this.interceptors[id] = null
    }
  }

  /**
   * Clears all interceptors
   */
  public clear(): void {
    this.interceptors = []
  }

  /**
   * Executes all interceptors in sequence
   * @param value Initial value to transform
   * @returns Transformed value after all interceptors
   */
  public async execute(value: any): Promise<any> {
    let result = value

    for (const interceptor of this.interceptors) {
      if (interceptor !== null) {
        try {
          result = await (interceptor.fulfilled as Function)(result)
        } catch (error) {
          if (interceptor.rejected) {
            result = await (interceptor.rejected as Function)(error)
          } else {
            throw error
          }
        }
      }
    }

    return result
  }

  /**
   * Executes all fulfilled handlers in sequence
   * @param value Initial value
   */
  public async executeFulfilled(value: any): Promise<any> {
    let result = value

    for (const interceptor of this.interceptors) {
      if (interceptor !== null && interceptor.fulfilled) {
        result = await (interceptor.fulfilled as Function)(result)
      }
    }

    return result
  }

  /**
   * Executes error handlers for a given error
   * @param error The error to handle
   */
  public async executeRejected(error: any): Promise<any> {
    let result = error

    for (const interceptor of this.interceptors) {
      if (interceptor !== null && interceptor.rejected) {
        try {
          result = await (interceptor.rejected as Function)(result)
          // If an error interceptor returns a value, it's considered handled
          return result
        } catch (newError) {
          result = newError
        }
      }
    }

    throw result
  }

  /**
   * Gets all active interceptors
   */
  public getInterceptors(): Array<InterceptorTuple<T, E> | null> {
    return this.interceptors
  }
}

/**
 * Container for request and response interceptor managers
 */
export class InterceptorContainer {
  public request: InterceptorManager<RequestInterceptor, ErrorInterceptor>
  public response: InterceptorManager<ResponseInterceptor, ErrorInterceptor>

  constructor() {
    this.request = new InterceptorManager<
      RequestInterceptor,
      ErrorInterceptor
    >()
    this.response = new InterceptorManager<
      ResponseInterceptor,
      ErrorInterceptor
    >()
  }
}
