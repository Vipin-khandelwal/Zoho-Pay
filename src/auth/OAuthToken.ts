/**
 * Represents a Zoho OAuth 2.0 access token and its lifetime.
 */
export class OAuthToken {
  readonly accessToken: string;
  /** Token lifetime in seconds as returned by Zoho IAM. */
  readonly expiresIn: number;
  /** Absolute expiry timestamp (ms since epoch), set at construction time. */
  readonly expiresAt: number;

  constructor(accessToken: string, expiresIn: number) {
    if (!accessToken) {
      throw new Error("accessToken must not be empty");
    }
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.expiresAt = Date.now() + expiresIn * 1000;
  }

  /** Returns true if the token has expired (with a 30-second buffer). */
  isExpired(): boolean {
    return Date.now() >= this.expiresAt - 30_000;
  }
}
