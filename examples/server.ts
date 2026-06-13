/**
 * Zoho Payments SDK — Playground Dev Server
 *
 * Runs a local Express server that:
 *  - Serves the playground HTML at /
 *  - Proxies all OAuth + API calls to Zoho (bypassing browser CORS restrictions)
 *
 * Usage:
 *   bun run playground          (or: npx tsx examples/server.ts)
 *
 * The server listens on http://localhost:3579 by default.
 * Set PORT env var to override.
 */

import express, { type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ZohoPayments,
  Edition,
  buildAuthorizationUrl,
  parseOAuthCallback,
  OAUTH_SCOPES,
  ZohoPaymentsException,
  ZohoPaymentsAPIException,
  AuthenticationException,
  InvalidRequestException,
  RateLimitException,
  ResourceNotFoundException,
  PermissionException,
} from "../src/index.js";
import type { ConfigurationsParams } from "../src/params/common.js";
import type { PaymentSessionTransferDetailParams } from "../src/params/payment-session.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env["PORT"] ?? 3579);

const app = express();
app.use(express.json());


app.use((req, res, next) => {
  console.log(`\n[${req.method}] ${req.originalUrl}`);
  console.log("  Body:", req.body);
  console.log("  Query:", req.query);
  next();
});
// ── Static files ──────────────────────────────────────────────────────────────
// Serve dist/ for the SDK bundle
app.use("/dist", express.static(path.join(__dirname, "../dist")));

// ── Playground HTML ───────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "playground.html"));
});



// ── Helpers ───────────────────────────────────────────────────────────────────
function parseEdition(raw: unknown): Edition {
  if (raw === "IN") return Edition.IN;
  if (raw === "IN_SANDBOX") return Edition.IN_SANDBOX;
  if (raw === "US") return Edition.US;
  throw new Error(`Unknown edition: ${String(raw)}`);
}

function apiError(res: Response, err: unknown): void {
  if (err instanceof AuthenticationException) {
    res.status(401).json({ error: "AuthenticationException", message: err.message, hint: "Refresh the access token." });
  } else if (err instanceof PermissionException) {
    res.status(403).json({ error: "PermissionException", message: err.message });
  } else if (err instanceof ResourceNotFoundException) {
    res.status(404).json({ error: "ResourceNotFoundException", message: err.message });
  } else if (err instanceof InvalidRequestException) {
    res.status(400).json({ error: "InvalidRequestException", message: err.message, code: err.codeString, apiMessage: err.apiErrorMessage });
  } else if (err instanceof RateLimitException) {
    res.status(429).json({ error: "RateLimitException", message: err.message });
  } else if (err instanceof ZohoPaymentsAPIException) {
    res.status(err.httpStatusCode).json({ error: "ZohoPaymentsAPIException", message: err.message, code: err.codeString, apiMessage: err.apiErrorMessage });
  } else if (err instanceof ZohoPaymentsException) {
    const cause = (err as { cause?: unknown }).cause;
    res.status(502).json({
      error: "ZohoPaymentsException",
      message: err.message,
      ...(cause !== undefined ? { cause } : {}),
    });
  } else {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "InternalError", message: msg });
  }
}

// ── OAuth routes ──────────────────────────────────────────────────────────────

/** POST /api/auth/url — build the authorization URL (no network call) */
app.post("/api/auth/url", (req: Request, res: Response) => {
  try {
    const { clientId, accountId, redirectUri, edition, scopes, accessType, state, sandboxScopes } = req.body as Record<string, unknown>;
    const ed = parseEdition(edition);
    const scopeList = Array.isArray(scopes) && scopes.length > 0
      ? (scopes as string[])
      : [
          OAUTH_SCOPES.PAYMENTS_CREATE,
          OAUTH_SCOPES.PAYMENTS_READ,
          OAUTH_SCOPES.PAYMENTS_UPDATE,
          OAUTH_SCOPES.CUSTOMERS_CREATE,
          OAUTH_SCOPES.CUSTOMERS_READ,
          OAUTH_SCOPES.REFUNDS_CREATE,
          OAUTH_SCOPES.REFUNDS_READ,
        ];
    const normalizedScopes = sandboxScopes === true
      ? scopeList.map((scope) => scope.replace(/^ZohoPay\./, "ZohoPaySandbox."))
      : scopeList;

    const authUrl = buildAuthorizationUrl({
      clientId: String(clientId),
      accountId: String(accountId),
      scopes: normalizedScopes,
      redirectUri: String(redirectUri),
      edition: ed,
      accessType: accessType === "online" ? "online" : "offline",
      ...(state !== undefined ? { state: String(state) } : {}),
    });

    res.json({ authUrl });
  } catch (err) {
    apiError(res, err);
  }
});

/** POST /api/auth/parse-callback — parse the callback URL (no network call) */
app.post("/api/auth/parse-callback", (req: Request, res: Response) => {
  try {
    const { callbackUrl } = req.body as Record<string, unknown>;
    if (!callbackUrl) { res.status(400).json({ error: "callbackUrl is required" }); return; }
    const result = parseOAuthCallback(String(callbackUrl));
    res.json(result);
  } catch (err) {
    apiError(res, err);
  }
});

/** POST /api/auth/exchange — exchange auth code for tokens */
app.post("/api/auth/exchange", async (req: Request, res: Response) => {
  try {
    const { code, clientId, clientSecret, redirectUri, edition } = req.body as Record<string, unknown>;
    if (!code) { res.status(400).json({ error: "code is required" }); return; }
    const result = await ZohoPayments.exchangeCodeForToken({
      code: String(code),
      clientId: String(clientId),
      clientSecret: String(clientSecret),
      redirectUri: String(redirectUri),
      edition: parseEdition(edition),
    });
    res.json(result);
  } catch (err) {
    apiError(res, err);
  }
});

/** POST /api/auth/refresh — refresh access token */
app.post("/api/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken, clientId, clientSecret, redirectUri, edition } = req.body as Record<string, unknown>;
    const token = await ZohoPayments.generateAccessToken({
      refreshToken: String(refreshToken),
      clientId: String(clientId),
      clientSecret: String(clientSecret),
      redirectUri: String(redirectUri),
      edition: parseEdition(edition),
    });
    res.json({ accessToken: token.accessToken, expiresIn: token.expiresIn, expiresAt: token.expiresAt });
  } catch (err) {
    apiError(res, err);
  }
});

/** POST /api/auth/revoke — revoke a refresh token */
app.post("/api/auth/revoke", async (req: Request, res: Response) => {
  try {
    const { token, edition } = req.body as Record<string, unknown>;
    await ZohoPayments.revokeToken({ token: String(token), edition: parseEdition(edition) });
    res.json({ revoked: true });
  } catch (err) {
    apiError(res, err);
  }
});

// ── SDK API routes ────────────────────────────────────────────────────────────
// All routes below require { accountId, edition, accessToken } in body (POST) or query (GET).

function buildClient(params: Record<string, unknown>) {
  const { accountId, edition, accessToken } = params;
  if (!accountId)   throw new Error("accountId is required");
  if (!accessToken) throw new Error("accessToken is required");
  return ZohoPayments.builder()
    .accountId(String(accountId))
    .edition(parseEdition(edition))
    .accessToken(String(accessToken))
    .build();
}

/** Wraps a route handler so buildClient errors are caught and returned as JSON */
function withClient(
  source: (req: Request) => Record<string, unknown>,
  handler: (client: ReturnType<typeof buildClient>, req: Request, res: Response) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    let client: ReturnType<typeof buildClient> | undefined;
    try {
      client = buildClient(source(req));
      await handler(client, req, res);
    } catch (err) {
      apiError(res, err);
    } finally {
      client?.close();
    }
  };
}

const fromBody  = (req: Request) => req.body as Record<string, unknown>;
const fromQuery = (req: Request) => req.query as Record<string, unknown>;

function routeId(req: Request): string {
  const id = req.params["id"];
  return Array.isArray(id) ? id[0] ?? "" : id ?? "";
}

// Payment Sessions
app.post("/api/payment-sessions", withClient(fromBody, async (client, req, res) => {
  const {
    amount,
    currency,
    description,
    expiresIn,
    transferDetails,
    metaData,
    invoiceNumber,
    referenceNumber,
    maxRetryCount,
    configurations,
  } = req.body as Record<string, unknown>;
  const result = await client.paymentSessions().create({
    amount: Number(amount),
    currency: String(currency),
    description: String(description),
    ...(expiresIn !== undefined ? { expiresIn: Number(expiresIn) } : {}),
    ...(Array.isArray(transferDetails) ? { transferDetails: transferDetails as PaymentSessionTransferDetailParams[] } : {}),
    ...(Array.isArray(metaData) ? { metaData: metaData as { key: string; value: string }[] } : {}),
    ...(invoiceNumber !== undefined ? { invoiceNumber: String(invoiceNumber) } : {}),
    ...(referenceNumber !== undefined ? { referenceNumber: String(referenceNumber) } : {}),
    ...(maxRetryCount !== undefined ? { maxRetryCount: Number(maxRetryCount) } : {}),
    ...(configurations !== undefined && typeof configurations === "object" && !Array.isArray(configurations)
      ? { configurations: configurations as ConfigurationsParams }
      : {}),
  });
  res.json(result);
}));

app.get("/api/payment-sessions/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.paymentSessions().get(routeId(req)));
}));

// Payments
app.get("/api/payments/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.payments().get(routeId(req)));
}));

app.get("/api/payments", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.payments().list());
}));

// Payment Links
app.post("/api/payment-links", withClient(fromBody, async (client, req, res) => {
  const { amount, currency, description, email, phone, notifyCustomer, metaData } = req.body as Record<string, unknown>;
  const result = await client.paymentLinks().create({
    amount: Number(amount),
    currency: String(currency),
    description: String(description),
    ...(email !== undefined ? { email: String(email) } : {}),
    ...(phone !== undefined ? { phone: String(phone) } : {}),
    ...(notifyCustomer !== undefined ? { notifyCustomer: notifyCustomer as { email: boolean; sms: boolean } } : {}),
    ...(Array.isArray(metaData) ? { metaData: metaData as { key: string; value: string }[] } : {}),
  });
  res.json(result);
}));

app.post("/api/payment-links/:id/cancel", withClient(fromBody, async (client, req, res) => {
  res.json(await client.paymentLinks().cancel(routeId(req)));
}));

app.get("/api/payment-links/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.paymentLinks().get(routeId(req)));
}));

app.get("/api/payment-links", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.paymentLinks().list());
}));


// Customers
app.post("/api/customers", withClient(fromBody, async (client, req, res) => {
  const { name, email, metaData } = req.body as Record<string, unknown>;
  const result = await client.customers().create({
    name: String(name),
    email: String(email),
    ...(Array.isArray(metaData) ? { metaData: metaData as { key: string; value: string }[] } : {}),
  });
  res.json(result);
}));

app.get("/api/customers/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.customers().get(routeId(req)));
}));

app.get("/api/customers", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.customers().list());
}));

// Refunds
app.post("/api/refunds", withClient(fromBody, async (client, req, res) => {
  const { paymentId, amount, reason, type, description, metaData } = req.body as Record<string, unknown>;
  if (!paymentId) { res.status(400).json({ error: "paymentId is required" }); return; }
  if (!amount) { res.status(400).json({ error: "amount is required" }); return; }
  if (!reason) { res.status(400).json({ error: "reason is required" }); return; }
  const refundType = type === "initiated_by_customer" || type === "initiated_by_system"
    ? type
    : "initiated_by_merchant";
  res.json(await client.refunds().create(String(paymentId), {
    amount: Number(amount),
    reason: String(reason),
    type: refundType,
    ...(description !== undefined ? { description: String(description) } : {}),
    ...(Array.isArray(metaData) ? { metaData: metaData as { key: string; value: string }[] } : {}),
  }));
}));

app.get("/api/refunds/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.refunds().get(routeId(req)));
}));

app.get("/api/refunds", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.refunds().list());
}));

// Mandates
app.post("/api/mandates/enrollment-session", withClient(fromBody, async (client, req, res) => {
  const {
    amount,
    currency,
    customerId,
    description,
    invoiceNumber,
    maxRetryCount,
    configurations,
    mandateDetails,
    metaData,
  } = req.body as Record<string, unknown>;
  if (!mandateDetails || typeof mandateDetails !== "object" || Array.isArray(mandateDetails)) {
    res.status(400).json({ error: "mandateDetails is required" });
    return;
  }
  res.json(await client.mandates().createEnrollmentSession({
    amount: Number(amount),
    currency: String(currency),
    customerId: String(customerId),
    description: String(description),
    mandateDetails: mandateDetails as Parameters<ReturnType<typeof client.mandates>["createEnrollmentSession"]>[0]["mandateDetails"],
    ...(invoiceNumber !== undefined ? { invoiceNumber: String(invoiceNumber) } : {}),
    ...(maxRetryCount !== undefined ? { maxRetryCount: Number(maxRetryCount) } : {}),
    ...(configurations !== undefined && typeof configurations === "object" && !Array.isArray(configurations)
      ? { configurations: configurations as Parameters<ReturnType<typeof client.mandates>["createEnrollmentSession"]>[0]["configurations"] }
      : {}),
    ...(Array.isArray(metaData) ? { metaData: metaData as { key: string; value: string }[] } : {}),
  }));
}));

app.post("/api/mandates/execution-session", withClient(fromBody, async (client, req, res) => {
  const { amount, currency, customerId, description, invoiceNumber, maxRetryCount, metaData } = req.body as Record<string, unknown>;
  res.json(await client.mandates().createExecutionSession({
    amount: Number(amount),
    currency: String(currency),
    customerId: String(customerId),
    description: String(description),
    invoiceNumber: String(invoiceNumber),
    ...(maxRetryCount !== undefined ? { maxRetryCount: Number(maxRetryCount) } : {}),
    ...(Array.isArray(metaData) ? { metaData: metaData as { key: string; value: string }[] } : {}),
  }));
}));

app.post("/api/mandates/notify", withClient(fromBody, async (client, req, res) => {
  const { mandateId, amount, executionDate, description, invoiceNumber } = req.body as Record<string, unknown>;
  res.json(await client.mandates().notify({
    mandateId: String(mandateId),
    amount: Number(amount),
    executionDate: String(executionDate),
    description: String(description),
    invoiceNumber: String(invoiceNumber),
  }));
}));

app.post("/api/mandates/execute", withClient(fromBody, async (client, req, res) => {
  const {
    customerId,
    mandateId,
    paymentsSessionId,
    invoiceNumber,
    amount,
    mandateNotificationId,
    receiptEmail,
    phone,
    phoneCountryCode,
    description,
    referenceNumber,
  } = req.body as Record<string, unknown>;
  res.json(await client.mandates().execute({
    customerId: String(customerId),
    mandateId: String(mandateId),
    paymentsSessionId: String(paymentsSessionId),
    invoiceNumber: String(invoiceNumber),
    amount: Number(amount),
    ...(mandateNotificationId !== undefined ? { mandateNotificationId: String(mandateNotificationId) } : {}),
    ...(receiptEmail !== undefined ? { receiptEmail: String(receiptEmail) } : {}),
    ...(phone !== undefined ? { phone: String(phone) } : {}),
    ...(phoneCountryCode !== undefined ? { phoneCountryCode: String(phoneCountryCode) } : {}),
    ...(description !== undefined ? { description: String(description) } : {}),
    ...(referenceNumber !== undefined ? { referenceNumber: String(referenceNumber) } : {}),
  }));
}));

app.post("/api/mandates/auto-execute", withClient(fromBody, async (client, req, res) => {
  const {
    customerId,
    mandateId,
    paymentsSessionId,
    invoiceNumber,
    amount,
    receiptEmail,
    phone,
    phoneCountryCode,
    description,
    referenceNumber,
  } = req.body as Record<string, unknown>;
  res.json(await client.mandates().autoExecute({
    customerId: String(customerId),
    mandateId: String(mandateId),
    paymentsSessionId: String(paymentsSessionId),
    invoiceNumber: String(invoiceNumber),
    amount: Number(amount),
    ...(receiptEmail !== undefined ? { receiptEmail: String(receiptEmail) } : {}),
    ...(phone !== undefined ? { phone: String(phone) } : {}),
    ...(phoneCountryCode !== undefined ? { phoneCountryCode: String(phoneCountryCode) } : {}),
    ...(description !== undefined ? { description: String(description) } : {}),
    ...(referenceNumber !== undefined ? { referenceNumber: String(referenceNumber) } : {}),
  }));
}));

app.get(["/api/mandates", "/api/mandates/"], (_req: Request, res: Response) => {
  res.status(400).json({ error: "mandateId is required", message: "Use GET /api/mandates/:id to retrieve a mandate." });
});

app.get(["/api/mandates/notifications", "/api/mandates/notifications/"], (_req: Request, res: Response) => {
  res.status(400).json({ error: "mandateNotificationId is required", message: "Use GET /api/mandates/notifications/:id to retrieve a mandate notification." });
});

app.get("/api/mandates/notifications/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.mandates().getNotification(routeId(req)));
}));

app.get("/api/mandates/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.mandates().get(routeId(req)));
}));

// ── Error handler ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  apiError(res, err);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  Zoho Payments Playground`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  All API calls are proxied server-side.`);
  console.log(`  No CORS issues.\n`);
});
