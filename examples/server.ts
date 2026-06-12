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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env["PORT"] ?? 3579);

const app = express();
app.use(express.json());

// ── Static files ──────────────────────────────────────────────────────────────
// Serve dist/ for the SDK bundle
app.use("/dist", express.static(path.join(__dirname, "../dist")));

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
    res.status(502).json({ error: "ZohoPaymentsException", message: err.message });
  } else {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "InternalError", message: msg });
  }
}

// ── OAuth routes ──────────────────────────────────────────────────────────────

/** POST /api/auth/url — build the authorization URL (no network call) */
app.post("/api/auth/url", (req: Request, res: Response) => {
  try {
    const { clientId, accountId, redirectUri, edition, scopes, accessType, state } = req.body as Record<string, unknown>;
    const ed = parseEdition(edition);
    const scopeList = Array.isArray(scopes) && scopes.length > 0
      ? (scopes as string[])
      : [
          OAUTH_SCOPES.PAYMENT_LINKS_CREATE,
          OAUTH_SCOPES.PAYMENT_LINKS_READ,
          OAUTH_SCOPES.PAYMENT_LINKS_UPDATE,
          OAUTH_SCOPES.PAYMENT_SESSIONS_CREATE,
          OAUTH_SCOPES.PAYMENT_SESSIONS_READ,
          OAUTH_SCOPES.PAYMENTS_CREATE,
          OAUTH_SCOPES.PAYMENTS_READ,
          OAUTH_SCOPES.CUSTOMERS_CREATE,
          OAUTH_SCOPES.CUSTOMERS_READ,
          OAUTH_SCOPES.REFUNDS_CREATE,
          OAUTH_SCOPES.REFUNDS_READ,
        ];

    const authUrl = buildAuthorizationUrl({
      clientId: String(clientId),
      accountId: String(accountId),
      scopes: scopeList,
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
  res.json(await client.paymentLinks().cancel(req.params["id"]!));
}));

app.get("/api/payment-links/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.paymentLinks().get(req.params["id"]!));
}));

app.get("/api/payment-links", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.paymentLinks().list());
}));

// Payment Sessions
app.post("/api/payment-sessions", withClient(fromBody, async (client, req, res) => {
  const { amount, currency, description, expiresIn } = req.body as Record<string, unknown>;
  res.json(await client.paymentSessions().create({
    amount: Number(amount),
    currency: String(currency),
    description: String(description),
    ...(expiresIn !== undefined ? { expiresIn: Number(expiresIn) } : {}),
  }));
}));

app.get("/api/payment-sessions/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.paymentSessions().get(req.params["id"]!));
}));

// Payments
app.get("/api/payments/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.payments().get(req.params["id"]!));
}));

app.get("/api/payments", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.payments().list());
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
  res.json(await client.customers().get(req.params["id"]!));
}));

app.get("/api/customers", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.customers().list());
}));

// Refunds
app.post("/api/refunds", withClient(fromBody, async (client, req, res) => {
  const { paymentId, amount, reason, type } = req.body as Record<string, unknown>;
  if (!paymentId) { res.status(400).json({ error: "paymentId is required" }); return; }
  if (!amount) { res.status(400).json({ error: "amount is required" }); return; }
  if (!reason) { res.status(400).json({ error: "reason is required" }); return; }
  const refundType = type === "full" ? "full" : "partial";
  res.json(await client.refunds().create(String(paymentId), {
    amount: Number(amount),
    reason: String(reason),
    type: refundType,
  }));
}));

app.get("/api/refunds/:id", withClient(fromQuery, async (client, req, res) => {
  res.json(await client.refunds().get(req.params["id"]!));
}));

app.get("/api/refunds", withClient(fromQuery, async (client, _req, res) => {
  res.json(await client.refunds().list());
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
