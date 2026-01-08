/**
 * Generates unique storage keys for OrderCloud client instances
 * to prevent collisions when multiple clients are used
 */
export class StorageKeyGenerator {
  private readonly clientHash: string
  private readonly environment: string

  constructor(clientID: string) {
    this.clientHash = this.hashClientID(clientID)
    this.environment = this.detectEnvironment()
  }

  /**
   * Generate a storage key for a specific purpose
   * Format: oc_${hash(clientID)}_${env}_${purpose}
   */
  public generateKey(purpose: string): string {
    return `oc_${this.clientHash}_${this.environment}_${purpose}`
  }

  /**
   * Simple hash function for client ID
   * Uses a basic string hash to create a short identifier
   */
  private hashClientID(clientID: string): string {
    let hash = 0
    for (let i = 0; i < clientID.length; i++) {
      const char = clientID.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    // Convert to base36 for shorter string
    return Math.abs(hash).toString(36)
  }

  /**
   * Detect environment (browser vs node)
   */
  private detectEnvironment(): string {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return 'browser'
    }
    return 'node'
  }

  /**
   * Get all possible keys for cleanup purposes
   */
  public getAllKeys(): {
    accessToken: string
    refreshToken: string
    impersonationToken: string
  } {
    return {
      accessToken: this.generateKey('access_token'),
      refreshToken: this.generateKey('refresh_token'),
      impersonationToken: this.generateKey('impersonation_token'),
    }
  }
}
