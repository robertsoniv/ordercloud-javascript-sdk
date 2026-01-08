import { Configuration } from '../configuration'
import cookie from './CookieApi'

/**
 * @ignore
 * not part of public api, don't include in generated docs
 */
export default class CookieService {
  private readonly config: Configuration

  constructor(config: Configuration) {
    this.config = config
    this.get = this.get.bind(this)
    this.set = this.set.bind(this)
    this.remove = this.remove.bind(this)
  }

  public get(name: string): string {
    const configuration = this.config.Get()
    const cookieName = configuration.cookieOptions.prefix + name
    return cookie.read(cookieName)
  }

  public set(name: string, cookieVal: string): void {
    const configuration = this.config.Get()
    const cookieName = configuration.cookieOptions.prefix + name
    cookie.write(cookieName, cookieVal, configuration.cookieOptions)
  }

  public remove(name: string): void {
    const configuration = this.config.Get()
    const cookieName = configuration.cookieOptions.prefix + name
    cookie.write(cookieName, undefined, configuration.cookieOptions)
  }
}
