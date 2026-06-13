# zohopay

TypeScript SDK for the [Zoho Payments API](https://www.zoho.com/payments/). Supports India (production + sandbox) and United States editions.

## Features

- Full OAuth 2.0 flow — authorization URL, code exchange, token refresh, revoke
- Payment Links — create, update, cancel, list, get
- Payment Sessions — create, get
- Payments — create (US), get, list, verify
- Customers — create, get, list (US), delete (US)
- Refunds — create, get, list
- Pluggable HTTP transport — inject retries, proxies, or logging
- Strict TypeScript types, zero runtime dependencies

## Requirements

- Node.js ≥ 18 (uses native `fetch`)
- TypeScript ≥ 5.5

## Install

```bash
bun install        # or: npm install
bun run build      # or: npm run build
```

## Quick start

```ts
import { ZohoPayments, Edition } from "zohopay";

const client = ZohoPayments.builder()
  .accountId("YOUR_ACCOUNT_ID")
  .edition(Edition.IN)          // Edition.IN | Edition.IN_SANDBOX | Edition.US
  .accessToken("1000.xxxx.yyyy")
  .requestTimeoutMs(45_000)     // optional, default 60 s
  .build();
```

## OAuth flow

### 1 — Build the authorization URL

```ts
import { buildAuthorizationUrl, Edition, OAUTH_SCOPES } from "zohopay";

const authUrl = buildAuthorizationUrl({
  clientId:    "1000.YOUR_CLIENT_ID",
  accountId:   "YOUR_ACCOUNT_ID",
  redirectUri: "https://yourapp.example.com/oauth/callback",
  edition:     Edition.IN,
  accessType:  "offline",           // "offline" to get a refresh token
  scopes: [
    OAUTH_SCOPES.PAYMENTS_CREATE,
    OAUTH_SCOPES.PAYMENTS_READ,
    OAUTH_SCOPES.PAYMENTS_UPDATE,
    OAUTH_SCOPES.CUSTOMERS_CREATE,
    OAUTH_SCOPES.CUSTOMERS_READ,
    OAUTH_SCOPES.REFUNDS_CREATE,
    OAUTH_SCOPES.REFUNDS_READ,
  ],
  state: "csrf-token-here",         // recommended — validate on callback
});

// Redirect the user to authUrl
```

### 2 — Parse the callback and exchange the code

```ts
import { parseOAuthCallback, exchangeCodeForToken } from "zohopay";

const callback = parseOAuthCallback(req.url);
// Validate callback.state against your stored CSRF token here

const tokenSet = await exchangeCodeForToken({
  code:         callback.code!,
  clientId:     "1000.YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  redirectUri:  "https://yourapp.example.com/oauth/callback",
  edition:      Edition.IN,
});

// tokenSet.accessToken  — use immediately
// tokenSet.refreshToken — store securely for later refreshes
// tokenSet.expiresIn    — seconds until access token expires
```

### 3 — Refresh the access token

The SDK does **not** auto-refresh. Call this when the token expires, then push it into the client.

```ts
const fresh = await ZohoPayments.generateAccessToken({
  refreshToken: "1000.stored_refresh_token",
  clientId:     "1000.YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  redirectUri:  "https://yourapp.example.com/oauth/callback",
  edition:      Edition.IN,
});

client.updateOAuthToken(fresh);   // no rebuild needed
// fresh.isExpired() — check with 30 s buffer
```

### 4 — Revoke a refresh token

```ts
await ZohoPayments.revokeToken({
  token:   "1000.stored_refresh_token",
  edition: Edition.IN,
});
```

## Payment Links

```ts
// Create
const link = await client.paymentLinks().create({
  amount:      500,
  currency:    "INR",
  description: "Order #1234",
  email:       "customer@example.com",
  notifyCustomer: { email: true, sms: false },
  metaData:    [{ key: "order_id", value: "ORD-1234" }],
});
console.log(link.paymentLinkId, link.url);

// Get
const link = await client.paymentLinks().get("link_id");

// Update
const updated = await client.paymentLinks().update("link_id", { amount: 600 });

// Cancel
const cancelled = await client.paymentLinks().cancel("link_id");

// List
const { items, pageContext } = await client.paymentLinks().list({ page: 1, perPage: 20 });
```

## Payment Sessions

```ts
const session = await client.paymentSessions().create({
  amount:        250,
  currency:      "INR",
  description:   "Checkout session",
  expiresIn:     600,          // 300–900 seconds
  maxRetryCount: 3,            // 1–5
});
console.log(session.paymentsSessionId, session.accessKey);

const session = await client.paymentSessions().get("session_id");
```

## Payments

```ts
// Verify / get a payment
const payment = await client.payments().verify("payment_id");
console.log(payment.status, payment.amount, payment.currency);

// List
const { items } = await client.payments().list({ status: "success", page: 1 });

// Create (US edition only)
const payment = await client.payments().create({
  customerId:      "cust_id",
  paymentMethodId: "pm_id",
  amount:          1000,
  currency:        "USD",
});
```

## Customers

```ts
// Create
const customer = await client.customers().create({
  name:  "Jane Doe",
  email: "jane@example.com",
  metaData: [{ key: "source", value: "web" }],
});

// Get
const customer = await client.customers().get("cust_id");

// List (US only)
const { items } = await client.customers().list({ email: "jane@example.com" });

// Delete (US only)
await client.customers().delete("cust_id");
```

## Refunds

```ts
// Create
const refund = await client.refunds().create("payment_id", {
  amount: 100,
  reason: "requested_by_customer",
  type:   "initiated_by_merchant",
});

// Get
const refund = await client.refunds().get("refund_id");

// List
const { items } = await client.refunds().list({ page: 1 });
```

## Error handling

```ts
import {
  AuthenticationException,
  PermissionException,
  ResourceNotFoundException,
  InvalidRequestException,
  RateLimitException,
  ZohoPaymentsAPIException,
  ConnectionException,
} from "zohopay";

try {
  await client.payments().get("id");
} catch (err) {
  if (err instanceof AuthenticationException) {
    // 401 — refresh the token and retry
  } else if (err instanceof RateLimitException) {
    // 429 — back off and retry
  } else if (err instanceof ResourceNotFoundException) {
    // 404
  } else if (err instanceof InvalidRequestException) {
    console.error(err.codeString, err.apiErrorMessage);
  } else if (err instanceof ZohoPaymentsAPIException) {
    console.error(err.httpStatusCode, err.message);
  } else if (err instanceof ConnectionException) {
    // network / timeout
  }
}
```

## Custom HTTP transport

Inject your own transport for retries, proxies, or instrumentation:

```ts
import { DefaultHttpTransport, ZohoPayments, Edition } from "zohopay";
import type { HttpTransport, ZohoRequest, ZohoResponse } from "zohopay";

class LoggingTransport implements HttpTransport {
  constructor(private readonly inner: HttpTransport) {}

  async execute(req: ZohoRequest): Promise<ZohoResponse> {
    console.log(`→ ${req.method} ${req.url}`);
    const res = await this.inner.execute(req);
    console.log(`← ${res.statusCode}`);
    return res;
  }
}

const client = ZohoPayments.builder()
  .accountId("YOUR_ACCOUNT_ID")
  .edition(Edition.IN)
  .accessToken("1000.xxxx.yyyy")
  .transport(new LoggingTransport(new DefaultHttpTransport()))
  .build();
```

> **Note:** `transport()` and `requestTimeoutMs()` are mutually exclusive with `connectTimeoutMs()`.

## Editions

| Constant | Region | API base |
|---|---|---|
| `Edition.IN` | India production | `payments.zoho.in` |
| `Edition.IN_SANDBOX` | India sandbox | `paymentssandbox.zoho.in` |
| `Edition.US` | United States | `payments.zoho.com` |

## Dev server

A local proxy server is included to test API calls without CORS issues:

```bash
bun run playground        # starts on http://127.0.0.1:3579
```

The server binds to `127.0.0.1` only and is not LAN-accessible.

## Scripts

| Command | Description |
|---|---|
| `bun run build` | Compile to `dist/` (CJS + ESM + types) |
| `bun run dev` | Watch mode |
| `bun run typecheck` | Type-check without emitting |
| `bun run test` | Run tests with Vitest |
| `bun run playground` | Start the dev proxy server |

## License

Apache-2.0
