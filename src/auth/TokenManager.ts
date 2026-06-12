import { OAuthToken } from "./OAuthToken.js";

/**
 * Thread-safe (single-threaded JS) store for the current OAuth access token.
 * Exposes atomic read/write so services always see a consistent value.
 */
export class TokenManager {
  private _accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("accessToken must not be empty");
    }
    this._accessToken = accessToken;
  }

  getAccessToken(): string {
    return this._accessToken;
  }

  updateToken(newAccessToken: string): void {
    if (!newAccessToken) {
      throw new Error("newAccessToken must not be empty");
    }
    this._accessToken = newAccessToken;
  }

  updateFromOAuthToken(token: OAuthToken): void {
    this.updateToken(token.accessToken);
  }
}
