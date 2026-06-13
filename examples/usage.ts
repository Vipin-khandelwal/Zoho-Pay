/**
 * Usage examples for the zohopay SDK.
 * Run with: bun examples/usage.ts
 */

import {
  ZohoPayments,
  Edition,
  AuthenticationException,
  InvalidRequestException,
  ZohoPaymentsAPIException,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  OAUTH_SCOPES,
  parseOAuthCallback,
} from "../src/index.js";

// ── 1. Build the client ───────────────────────────────────────────────────────

const client = ZohoPayments.builder()
  .accountId("23137556")
  .edition(Edition.IN)
  .accessToken("1000.xxxx.yyyy")
  .connectTimeoutMs(15_000)
  .requestTimeoutMs(45_000)
  .build();

// ── 2. Build an OAuth authorization URL (Step 2 of the OAuth flow) ────────────

const authUrl = buildAuthorizationUrl({
  clientId: "1000.YOUR_CLIENT_ID",
  accountId: "23137556",
  scopes: [
    OAUTH_SCOPES.PAYMENTS_CREATE,
    OAUTH_SCOPES.PAYMENTS_READ,
    OAUTH_SCOPES.CUSTOMERS_CREATE,
    OAUTH_SCOPES.CUSTOMERS_READ,
    OAUTH_SCOPES.REFUNDS_CREATE,
    OAUTH_SCOPES.REFUNDS_READ,
  ],
  redirectUri: "https://yourapp.example.com/oauth/callback",
  edition: Edition.IN,
  accessType: "offline",
});
console.log("Authorization URL:", authUrl);

// ── 3. Parse redirect callback and exchange auth code ────────────────────────

async function completeOAuthFlow(callbackUrl: string) {
  const callback = parseOAuthCallback(callbackUrl);

  if (!callback.code) {
    throw new Error("No authorization code found in callback URL");
  }

  const tokenSet = await exchangeCodeForToken({
    code: callback.code,
    clientId: "1000.YOUR_CLIENT_ID",
    clientSecret: "your_client_secret",
    redirectUri: "https://yourapp.example.com/oauth/callback",
    edition: Edition.IN,
  });

  console.log("Access token:", tokenSet.accessToken);
  console.log("Refresh token:", tokenSet.refreshToken);
  console.log("Expires in (s):", tokenSet.expiresIn);

  return tokenSet;
}

// ── 4. Refresh an access token ────────────────────────────────────────────────

async function refreshToken() {
  const fresh = await ZohoPayments.generateAccessToken({
    refreshToken: "1000.your_refresh_token",
    clientId: "1000.YOUR_CLIENT_ID",
    clientSecret: "your_client_secret",
    redirectUri: "https://yourapp.example.com/oauth/callback",
    edition: Edition.IN,
  });

  console.log("New access token:", fresh.accessToken);
  console.log("Expires in (s):", fresh.expiresIn);
  console.log("Is expired:", fresh.isExpired());

  // Push the new token into the running client (no rebuild needed)
  client.updateOAuthToken(fresh);
}

// ── 5. Revoke a refresh token ────────────────────────────────────────────────

async function revokeRefreshToken() {
  await ZohoPayments.revokeToken({
    token: "1000.your_refresh_token",
    edition: Edition.IN,
  });

  console.log("Refresh token revoked");
}

// ── 6. Create a payment link ──────────────────────────────────────────────────

async function createPaymentLink() {
  const link = await client.paymentLinks().create({
    amount: 500.0,
    currency: "INR",
    description: "Order #1234",
    email: "customer@example.com",
    notifyCustomer: { email: true, sms: false },
    metaData: [{ key: "order_id", value: "ORD-1234" }],
  });

  console.log("Created payment link:", link.paymentLinkId);
  console.log("URL:", link.url);
  return link;
}

// ── 7. Create a payment session ───────────────────────────────────────────────

async function createPaymentSession() {
  const session = await client.paymentSessions().create({
    amount: 250.0,
    currency: "INR",
    description: "Checkout session",
    expiresIn: 600,
    maxRetryCount: 3,
  });

  console.log("Session ID:", session.paymentsSessionId);
  console.log("Access key:", session.accessKey);
  return session;
}

// ── 8. Verify a payment ───────────────────────────────────────────────────────

async function verifyPayment(paymentId: string) {
  const payment = await client.payments().verify(paymentId);
  console.log("Payment status:", payment.status);
  console.log("Amount:", payment.amount, payment.currency);
  return payment;
}

// ── 9. Create a customer ──────────────────────────────────────────────────────

async function createCustomer() {
  const customer = await client.customers().create({
    name: "Jane Doe",
    email: "jane@example.com",
    metaData: [{ key: "source", value: "web" }],
  });

  console.log("Customer ID:", customer.customerId);
  return customer;
}

// ── 10. Create a refund ───────────────────────────────────────────────────────

async function createRefund(paymentId: string) {
  const refund = await client.refunds().create(paymentId, {
    amount: 100.0,
    reason: "requested_by_customer",
    type: "initiated_by_merchant",
  });

  console.log("Refund ID:", refund.refundId);
  console.log("Refund status:", refund.status);
  return refund;
}

// ── 11. Error handling ────────────────────────────────────────────────────────

async function withErrorHandling() {
  try {
    await client.payments().get("nonexistent_id");
  } catch (err) {
    if (err instanceof AuthenticationException) {
      console.error("Token expired — refresh and retry");
    } else if (err instanceof InvalidRequestException) {
      console.error("Bad request:", err.codeString, err.apiErrorMessage);
    } else if (err instanceof ZohoPaymentsAPIException) {
      console.error("API error:", err.httpStatusCode, err.message);
    } else {
      throw err;
    }
  }
}

// ── 12. Custom HTTP transport ─────────────────────────────────────────────────

import type { HttpTransport, ZohoRequest, ZohoResponse } from "../src/index.js";

class LoggingTransport implements HttpTransport {
  private readonly _inner: HttpTransport;

  constructor(inner: HttpTransport) {
    this._inner = inner;
  }

  async execute(request: ZohoRequest): Promise<ZohoResponse> {
    console.log(`→ ${request.method} ${request.url}`);
    const res = await this._inner.execute(request);
    console.log(`← ${res.statusCode}`);
    return res;
  }
}

// Inject the custom transport:
// import { DefaultHttpTransport } from "../src/index.js";
// const clientWithLogging = ZohoPayments.builder()
//   .accountId("23137556")
//   .edition(Edition.IN)
//   .accessToken("1000.xxxx.yyyy")
//   .transport(new LoggingTransport(new DefaultHttpTransport()))
//   .build();

// ── Cleanup ───────────────────────────────────────────────────────────────────
client.close();
