interface ApiError {
  ErrorCode: string
  Message: string
  Data: any
}

interface FetchErrorResponse {
  response: Response
  data?: any
  text?: string
  request?: any
}

export default class OrderCloudError extends Error {
  isOrderCloudError: true
  request?: any
  response: any
  errors?: ApiError[]
  status: number
  errorCode: string
  statusText: string

  constructor(ex: FetchErrorResponse | any) {
    const errors = safeParseErrors(ex) // extract ordercloud errors from response
    const firstError = errors?.[0] // most of the time there is just one error

    super(getMessage(ex, firstError))
    this.isOrderCloudError = true
    this.errors = errors
    this.name = 'OrderCloudError'
    this.errorCode = getErrorCode(firstError)

    // Handle both new fetch error structure and legacy axios error structure
    if (ex.response) {
      this.status = ex.response.status
      this.statusText = ex.response.statusText
      this.response = ex.response
      this.request = ex.request

      // Debug logging to help diagnose error handling issues
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[OrderCloudError] Error details:', {
          status: this.status,
          statusText: this.statusText,
          errorCode: this.errorCode,
          message: this.message,
          errorsCount: errors?.length ?? 0,
          hasData: !!ex.data,
          hasText: !!ex.text,
        })
      }
    } else {
      // Fallback for unknown error structure
      this.status = 0
      this.statusText = 'Unknown error'
      this.response = undefined
      this.request = undefined

      // Warn about unexpected error structure
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          '[OrderCloudError] Received error in unexpected format. Expected { response: Response, data?: any, text?: string }',
          ex
        )
      }
    }
  }
}

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */
function safeParseErrors(ex: FetchErrorResponse | any): ApiError[] {
  try {
    // Handle new fetch error structure (data already parsed by HttpClient)
    if (ex.data && typeof ex.data === 'object') {
      return ex.data.Errors ?? []
    }

    // Handle legacy axios error structure
    let value = ex?.response?.data
    if (!value) {
      return []
    }
    if (typeof value === 'object') {
      return value.Errors ?? []
    }
    if (typeof value === 'string') {
      // Handle string responses (BOM character handling)
      if (value && value.charCodeAt(0) === 65279) {
        value = value.substring(1)
      }
      const data = JSON.parse(value)
      return data.Errors ?? []
    }
    return []
  } catch (e) {
    return []
  }
}

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */
function getMessage(ex: FetchErrorResponse | any, error?: ApiError): string {
  if (!error) {
    // Try to use text content from non-JSON responses as fallback
    if (ex.text) {
      // Truncate very long text responses (like HTML error pages)
      const maxLength = 200
      const text = ex.text.trim()
      return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text
    }
    return ex.response?.statusText ?? 'Unknown error'
  }
  switch (error.ErrorCode) {
    case 'NotFound':
      return `${error.Data.ObjectType} ${error.Data.ObjectID} not found`
    default:
      return error.Message
  }
}

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */
function getErrorCode(error?: ApiError): string {
  if (!error) {
    return 'OrderCloudError'
  }
  return error.ErrorCode
}
