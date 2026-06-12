import { Edition } from "./edition.js";
import { OAuthToken } from "./auth/OAuthToken.js";
import {
  exchangeCodeForToken,
  generateAccessToken,
  parseOAuthCallback,
  revokeToken,
  type ExchangeCodeForTokenParams,
  type ExchangeCodeForTokenResult,
  type GenerateAccessTokenParams,
  type ParseOAuthCallbackResult,
  type RevokeTokenParams,
} from "./auth/oauth.js";
import { ZohoPaymentsClient, type ZohoPaymentsClientOptions } from "./ZohoPaymentsClient.js";
import type { HttpTransport } from "./net/types.js";

/**
 * Top-level factory for the Zoho Payments SDK.
 *
 * @example
 * ```ts
 * const client = ZohoPayments.builder()
 *   .accountId("23137556")
 *   .edition(Edition.IN)
 *   .accessToken("1000.xxxx.yyyy")
 *   .build();
 * ```
 */
export class ZohoPayments {
  private constructor() {}

  static builder(): ZohoPaymentsClientBuilder {
    return new ZohoPaymentsClientBuilder();
  }

  /**
   * Exchange a refresh token for a new access token.
   * The SDK does NOT auto-refresh — call this when the token expires,
   * then push the result into the client via `client.updateOAuthToken(token)`.
   */
  static async generateAccessToken(
    params: GenerateAccessTokenParams
  ): Promise<OAuthToken> {
    return generateAccessToken(params);
  }

  static async exchangeCodeForToken(
    params: ExchangeCodeForTokenParams
  ): Promise<ExchangeCodeForTokenResult> {
    return exchangeCodeForToken(params);
  }

  static parseOAuthCallback(callbackUrl: string): ParseOAuthCallbackResult {
    return parseOAuthCallback(callbackUrl);
  }

  static async revokeToken(params: RevokeTokenParams): Promise<void> {
    return revokeToken(params);
  }
}

/**
 * Fluent builder for `ZohoPaymentsClient`.
 * The builder is single-use; calling `build()` twice throws.
 */
export class ZohoPaymentsClientBuilder {
  private _accountId: string | undefined;
  private _edition: Edition | undefined;
  private _accessToken: string | OAuthToken | undefined;
  private _connectTimeoutMs: number | undefined;
  private _requestTimeoutMs: number | undefined;
  private _defaultHeaders: Record<string, string> = {};
  private _transport: HttpTransport | undefined;
  private _consumed = false;

  accountId(accountId: string): this {
    this._accountId = accountId;
    return this;
  }

  edition(edition: Edition): this {
    this._edition = edition;
    return this;
  }

  /** Accept a raw access-token string or an OAuthToken. */
  accessToken(token: string | OAuthToken): this {
    this._accessToken = token;
    return this;
  }

  connectTimeoutMs(ms: number): this {
    this._connectTimeoutMs = ms;
    return this;
  }

  requestTimeoutMs(ms: number): this {
    this._requestTimeoutMs = ms;
    return this;
  }

  addDefaultHeader(name: string, value: string): this {
    const lower = name.toLowerCase();
    const reserved = new Set(["authorization", "user-agent", "accept", "content-type", "content-length", "host"]);
    if (reserved.has(lower)) {
      throw new Error(`Header "${name}" is managed by the SDK and cannot be overridden`);
    }
    this._defaultHeaders[name] = value;
    return this;
  }

  /** Inject a custom HTTP transport. Cannot be combined with connectTimeoutMs. */
  transport(transport: HttpTransport): this {
    this._transport = transport;
    return this;
  }

  build(): ZohoPaymentsClient {
    if (this._consumed) {
      throw new Error("ZohoPaymentsClientBuilder has already been consumed");
    }
    this._consumed = true;

    if (!this._accountId) throw new Error("accountId is required");
    if (!this._edition) throw new Error("edition is required");
    if (!this._accessToken) throw new Error("accessToken is required");

    const options: ZohoPaymentsClientOptions = {
      accountId: this._accountId,
      edition: this._edition,
      accessToken: this._accessToken,
      defaultHeaders: this._defaultHeaders,
      ...(this._connectTimeoutMs !== undefined ? { connectTimeoutMs: this._connectTimeoutMs } : {}),
      ...(this._requestTimeoutMs !== undefined ? { requestTimeoutMs: this._requestTimeoutMs } : {}),
      ...(this._transport !== undefined ? { transport: this._transport } : {}),
    };

    return new ZohoPaymentsClient(options);
  }
}
