import { SdkConfiguration } from './models'
import { InterceptorContainer } from './core/InterceptorManager'

/**
 * Instance-based configuration for OrderCloud client
 * Each client instance maintains its own immutable configuration
 */
export class Configuration {
  private readonly config: Readonly<SdkConfiguration>

  /**
   * Public interceptor container for adding request/response interceptors
   * @example
   * client.interceptors.request.use(
   *   (config) => {
   *     config.headers = { ...config.headers, 'X-Custom': 'value' }
   *     return config
   *   }
   * )
   */
  public readonly interceptors: InterceptorContainer = new InterceptorContainer()

  /**
   * Creates a new Configuration instance with the provided settings
   * Applies defaults for any missing values
   * @param config Partial configuration - any missing properties use defaults
   */
  constructor(config: Partial<SdkConfiguration> = {}) {
    const defaultConfig: SdkConfiguration = {
      baseApiUrl: 'https://api.ordercloud.io',
      apiVersion: 'v1',
      timeoutInMilliseconds: 60 * 1000, // 60 seconds by default
      clientID: null,
      cookieOptions: {
        samesite: 'lax', // browser default
        secure: false,
        domain: null,
        prefix: 'ordercloud',
        path: '/', // accessible on any path in the domain
      },
    }

    // Merge user config with defaults
    this.config = Object.freeze({
      ...defaultConfig,
      ...config,
      cookieOptions: {
        ...defaultConfig.cookieOptions,
        ...(config.cookieOptions || {}),
      },
    })
  }

  /**
   * Get the current configuration
   * @returns Readonly configuration object
   */
  public Get(): Readonly<SdkConfiguration> {
    return this.config
  }

  /**
   * Get base API URL
   */
  public get baseApiUrl(): string {
    return this.config.baseApiUrl
  }

  /**
   * Get API version
   */
  public get apiVersion(): string {
    return this.config.apiVersion
  }

  /**
   * Get client ID
   */
  public get clientID(): string | null {
    return this.config.clientID
  }

  /**
   * Get timeout in milliseconds
   */
  public get timeoutInMilliseconds(): number {
    return this.config.timeoutInMilliseconds
  }

  /**
   * Get cookie options
   */
  public get cookieOptions() {
    return this.config.cookieOptions
  }
}
