import { CancelToken } from './types'

/**
 * Custom error thrown when a request is cancelled
 */
export class CancelError extends Error {
  public readonly isCancelled = true

  constructor(message: string = 'Request cancelled') {
    super(message)
    this.name = 'CancelError'
  }
}

/**
 * Implementation of CancelToken using AbortController
 */
class CancelTokenImpl implements CancelToken {
  private controller: AbortController
  private _isCancelled = false
  private reason?: string

  constructor() {
    this.controller = new AbortController()
  }

  public cancel(reason?: string): void {
    if (!this._isCancelled) {
      this._isCancelled = true
      this.reason = reason
      this.controller.abort()
    }
  }

  public isCancelled(): boolean {
    return this._isCancelled
  }

  public get signal(): AbortSignal {
    return this.controller.signal
  }
}

/**
 * Manager for creating and handling request cancellation
 */
export class AbortManager {
  /**
   * Creates a new cancel token
   */
  public static createCancelToken(): CancelToken {
    return new CancelTokenImpl()
  }

  /**
   * Checks if an error is a cancellation error
   */
  public static isCancel(error: any): boolean {
    return (
      error instanceof CancelError ||
      error?.name === 'AbortError' ||
      error?.isCancelled === true
    )
  }

  /**
   * Creates an AbortSignal that times out after the specified duration
   */
  public static createTimeoutSignal(timeoutMs: number): AbortSignal {
    if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
      // Use native AbortSignal.timeout if available (Node 18+, modern browsers)
      return (AbortSignal as any).timeout(timeoutMs)
    }

    // Fallback for older environments
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeoutMs)
    return controller.signal
  }

  /**
   * Combines multiple abort signals into a single signal
   */
  public static combineSignals(
    ...signals: (AbortSignal | undefined)[]
  ): AbortSignal {
    const validSignals = signals.filter(
      (s): s is AbortSignal => s !== undefined
    )

    if (validSignals.length === 0) {
      return new AbortController().signal
    }

    if (validSignals.length === 1) {
      return validSignals[0]
    }

    // Use AbortSignal.any if available (newer browsers/Node)
    if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal) {
      return (AbortSignal as any).any(validSignals)
    }

    // Fallback: create a new controller and abort when any signal aborts
    const controller = new AbortController()
    validSignals.forEach(signal => {
      if (signal.aborted) {
        controller.abort()
      } else {
        signal.addEventListener('abort', () => controller.abort(), {
          once: true,
        })
      }
    })

    return controller.signal
  }
}
