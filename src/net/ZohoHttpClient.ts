import type { HttpTransport, ZohoRequest, ZohoResponse } from "./types.js";
import type { TokenManager } from "../auth/TokenManager.js";
import { Edition, getEditionConfig } from "../edition.js";
import { SDK_NAME, SDK_VERSION } from "../constants.js";
import {
  ZohoPaymentsAPIException,
  AuthenticationException,
  PermissionException,
  ResourceNotFoundException,
  InvalidRequestException,
  RateLimitException,
  ConnectionException,
} from "../exceptions.js";

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface ApiResponse {
  statusCode: number;
  body: Record<string, unknown>;
  rawBody: string;
}

const RESERVED_HEADERS = new Set([
  "authorization",
  "user-agent",
  "accept",
  "content-type",
  "content-length",
  "host",
]);

/**
 * Authenticated HTTP client bound to a specific account + edition.
 * Handles request construction, auth header injection, and error mapping.
 */
export class ZohoHttpClient {
  private readonly _transport: HttpTransport;
  private readonly _tokenManager: TokenManager;
  private readonly _edition: Edition;
  private readonly _accountId: string;
  private readonly _requestTimeoutMs: number | undefined;
  private readonly _defaultHeaders: Record<string, string>;
  private _closed = false;

  constructor(params: {
    transport: HttpTransport;
    tokenManager: TokenManager;
    edition: Edition;
    accountId: string;
    requestTimeoutMs?: number;
    defaultHeaders?: Record<string, string>;
  }) {
    this._transport = params.transport;
    this._tokenManager = params.tokenManager;
    this._edition = params.edition;
    this._accountId = params.accountId;
    this._requestTimeoutMs = params.requestTimeoutMs;
    this._defaultHeaders = { ...(params.defaultHeaders ?? {}) };
  }

  addDefaultHeader(name: string, value: string): void {
    if (RESERVED_HEADERS.has(name.toLowerCase())) {
      throw new Error(`Header "${name}" is managed by the SDK and cannot be overridden`);
    }
    this._defaultHeaders[name] = value;
  }

  async get(path: string, query?: QueryParams): Promise<ApiResponse> {
    return this._request("GET", path, query, undefined);
  }

  async post(path: string, body?: unknown): Promise<ApiResponse> {
    return this._request("POST", path, undefined, body);
  }

  async put(path: string, body?: unknown): Promise<ApiResponse> {
    return this._request("PUT", path, undefined, body);
  }

  async patch(path: string, body?: unknown): Promise<ApiResponse> {
    return this._request("PATCH", path, undefined, body);
  }

  async delete(path: string): Promise<ApiResponse> {
    return this._request("DELETE", path, undefined, undefined);
  }

  close(): void {
    if (this._closed) return;
    this._closed = true;
    this._transport.close?.();
  }

  private _buildUrl(path: string, query?: QueryParams): string {
    const config = getEditionConfig(this._edition);
    const base = `${config.apiBaseUrl}/${this._accountId}${path}`;
    if (!query) return base;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private _buildHeaders(hasBody: boolean): Record<string, string> {
    const token = this._tokenManager.getAccessToken();
    // SDK-managed headers are placed last so they always win over user defaults
    const headers: Record<string, string> = {
      ...this._defaultHeaders,
      Authorization: `Zoho-oauthtoken ${token}`,
      "User-Agent": `${SDK_NAME}/${SDK_VERSION}`,
      Accept: "application/json",
    };
    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  private async _request(
    method: ZohoRequest["method"],
    path: string,
    query?: QueryParams,
    body?: unknown
  ): Promise<ApiResponse> {
    if (this._closed) {
      throw new ConnectionException("Client has been closed");
    }

    const url = this._buildUrl(path, query);
    const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;
    const headers = this._buildHeaders(serializedBody !== undefined);

    const request: ZohoRequest = {
      method,
      url,
      headers,
      body: serializedBody,
      timeoutMs: this._requestTimeoutMs,
    } satisfies ZohoRequest;

    const response = await this._transport.execute(request);
    return this._handleResponse(response);
  }

  private _handleResponse(response: ZohoResponse): ApiResponse {
    const { statusCode, body: rawBody } = response;

    let parsed: Record<string, unknown> = {};
    try {
      if (rawBody) {
        parsed = JSON.parse(rawBody) as Record<string, unknown>;
      }
    } catch {
      if (statusCode < 200 || statusCode >= 300) {
        throw new ZohoPaymentsAPIException({
          message: `HTTP ${statusCode}: non-JSON response`,
          httpStatusCode: statusCode,
          rawBody: rawBody.slice(0, 500),
        });
      }
    }

    if (statusCode >= 200 && statusCode < 300) {
      return { statusCode, body: parsed, rawBody };
    }

    const codeString = parsed["code"] !== undefined ? String(parsed["code"]) : undefined;
    const apiMessage = parsed["message"] !== undefined ? String(parsed["message"]) : undefined;
    const message = apiMessage ?? `HTTP ${statusCode}`;

    const base = {
      message,
      httpStatusCode: statusCode,
      ...(codeString !== undefined ? { codeString } : {}),
      ...(apiMessage !== undefined ? { apiErrorMessage: apiMessage } : {}),
      rawBody,
    };

    switch (statusCode) {
      case 401: throw new AuthenticationException(base);
      case 403: throw new PermissionException(base);
      case 404: throw new ResourceNotFoundException(base);
      case 400:
      case 422: throw new InvalidRequestException({ ...base, httpStatusCode: statusCode });
      case 429: throw new RateLimitException(base);
      default: throw new ZohoPaymentsAPIException(base);
    }
  }
}
