import { Edition } from "./edition.js";
import { TokenManager } from "./auth/TokenManager.js";
import { OAuthToken } from "./auth/OAuthToken.js";
import { ZohoHttpClient } from "./net/ZohoHttpClient.js";
import { DefaultHttpTransport } from "./net/DefaultHttpTransport.js";
import type { HttpTransport } from "./net/types.js";
import { PaymentLinkService } from "./services/PaymentLinkService.js";
import { PaymentSessionService } from "./services/PaymentSessionService.js";
import { PaymentService } from "./services/PaymentService.js";
import { CustomerService } from "./services/CustomerService.js";
import { RefundService } from "./services/RefundService.js";
import { MandateService } from "./services/MandateService.js";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "./constants.js";

export interface ZohoPaymentsClientOptions {
  accountId: string;
  edition: Edition;
  accessToken: string | OAuthToken;
  connectTimeoutMs?: number;
  requestTimeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  /** Inject a custom HTTP transport (disables connectTimeoutMs). */
  transport?: HttpTransport;
}

/**
 * The main Zoho Payments API client.
 * Obtain one via `ZohoPayments.builder().build()` or `new ZohoPaymentsClient(options)`.
 */
export class ZohoPaymentsClient {
  private readonly _tokenManager: TokenManager;
  private readonly _http: ZohoHttpClient;
  private readonly _edition: Edition;

  // Services — eagerly constructed, stateless beyond the shared HTTP client
  private readonly _paymentLinks: PaymentLinkService;
  private readonly _paymentSessions: PaymentSessionService;
  private readonly _payments: PaymentService;
  private readonly _customers: CustomerService;
  private readonly _refunds: RefundService;
  private readonly _mandates: MandateService;

  private _closed = false;

  constructor(options: ZohoPaymentsClientOptions) {
    if (!options.accountId) throw new Error("accountId is required");
    if (!options.edition) throw new Error("edition is required");
    if (!options.accessToken) throw new Error("accessToken is required");

    if (options.transport !== undefined && options.connectTimeoutMs !== undefined) {
      throw new Error("connectTimeoutMs and a custom transport are mutually exclusive");
    }

    const rawToken =
      options.accessToken instanceof OAuthToken
        ? options.accessToken.accessToken
        : options.accessToken;

    this._tokenManager = new TokenManager(rawToken);
    this._edition = options.edition;

    const transport: HttpTransport =
      options.transport ??
      new DefaultHttpTransport({
        requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      });

    this._http = new ZohoHttpClient({
      transport,
      tokenManager: this._tokenManager,
      edition: options.edition,
      accountId: options.accountId,
      ...(options.requestTimeoutMs !== undefined ? { requestTimeoutMs: options.requestTimeoutMs } : {}),
      ...(options.defaultHeaders !== undefined ? { defaultHeaders: options.defaultHeaders } : {}),
    });

    this._paymentLinks = new PaymentLinkService(this._http);
    this._paymentSessions = new PaymentSessionService(this._http);
    this._payments = new PaymentService(this._http, options.edition);
    this._customers = new CustomerService(this._http, options.edition);
    this._refunds = new RefundService(this._http);
    this._mandates = new MandateService(this._http);
  }

  paymentLinks(): PaymentLinkService {
    return this._paymentLinks;
  }

  paymentSessions(): PaymentSessionService {
    return this._paymentSessions;
  }

  payments(): PaymentService {
    return this._payments;
  }

  customers(): CustomerService {
    return this._customers;
  }

  refunds(): RefundService {
    return this._refunds;
  }

  mandates(): MandateService {
    return this._mandates;
  }

  /** Replace the stored OAuth access token. */
  updateToken(newAccessToken: string): void {
    this._tokenManager.updateToken(newAccessToken);
  }

  /** Replace the stored token from an OAuthToken object. */
  updateOAuthToken(token: OAuthToken): void {
    this._tokenManager.updateFromOAuthToken(token);
  }

  /** Release transport-level resources. Idempotent. */
  close(): void {
    if (this._closed) return;
    this._closed = true;
    this._http.close();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.close();
  }
}
