import { Edition, getEditionConfig } from "../edition.js";
import { OAuthToken } from "./OAuthToken.js";
import { ZohoPaymentsException, ConnectionException } from "../exceptions.js";

export interface GenerateAccessTokenParams {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  edition: Edition;
}

export interface ExchangeCodeForTokenParams {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  edition: Edition;
}

export interface ExchangeCodeForTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface GenerateAuthorizationUrlParams {
  clientId: string;
  accountId: string;
  scopes: string[];
  redirectUri: string;
  edition: Edition;
  accessType?: "online" | "offline";
  state?: string;
}

export interface ParseOAuthCallbackResult {
  code: string | undefined;
  state: string | undefined;
  location: string | undefined;
  accountsServer: string | undefined;
}

export interface RevokeTokenParams {
  token: string;
  edition: Edition;
}

/**
 * Builds the authorization URL for Step 2 of the OAuth flow.
 * The user must visit this URL in a browser to grant access.
 */
export function buildAuthorizationUrl(
  params: GenerateAuthorizationUrlParams
): string {
  const { clientId, accountId, scopes, redirectUri, edition, accessType = "offline", state } = params;
  const config = getEditionConfig(edition);

  const isSandbox = edition === Edition.IN_SANDBOX;
  const soid = isSandbox
    ? `zohopaysandbox.${accountId}`
    : `zohopay.${accountId}`;

  const normalizedScopes = isSandbox
    ? scopes.map((scope) => scope.replace(/^ZohoPay\./, "ZohoPaySandbox."))
    : scopes;

  const query = new URLSearchParams({
    scope: normalizedScopes.join(","),
    client_id: clientId,
    soid,
    response_type: "code",
    redirect_uri: redirectUri,
    access_type: accessType,
  });

  if (state !== undefined) {
    query.set("state", state);
  }

  return `${config.accountsUrl}/oauth/v2/org/auth?${query.toString()}`;
}

/**
 * Exchanges an authorization code for access + refresh tokens (Step 3).
 */
export async function exchangeCodeForToken(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  edition: Edition;
}): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  return exchangeCodeForTokenInternal(params);
}

async function exchangeCodeForTokenInternal(
  params: ExchangeCodeForTokenParams
): Promise<ExchangeCodeForTokenResult> {
  const { code, clientId, clientSecret, redirectUri, edition } = params;
  const config = getEditionConfig(edition);
  const url = `${config.accountsUrl}/oauth/v2/token`;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const data = await _postForm(url, body);

  if (!data.access_token) {
    throw new ZohoPaymentsException(
      `Token exchange failed: ${JSON.stringify(data)}`
    );
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: Number(data.expires_in ?? data.expires_in_sec ?? 3600),
  };
}

export function parseOAuthCallback(
  callbackUrl: string
): ParseOAuthCallbackResult {
  const url = new URL(callbackUrl);
  return {
    code: url.searchParams.get("code") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    location: url.searchParams.get("location") ?? undefined,
    accountsServer: url.searchParams.get("accounts-server") ?? undefined,
  };
}

/**
 * Exchanges a refresh token for a new access token (Step 5).
 */
export async function generateAccessToken(
  params: GenerateAccessTokenParams
): Promise<OAuthToken> {
  const { refreshToken, clientId, clientSecret, redirectUri, edition } = params;

  if (!refreshToken) throw new Error("refreshToken must not be empty");
  if (!clientId) throw new Error("clientId must not be empty");
  if (!clientSecret) throw new Error("clientSecret must not be empty");
  if (!redirectUri) throw new Error("redirectUri must not be empty");

  const config = getEditionConfig(edition);
  const url = `${config.accountsUrl}/oauth/v2/token`;

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "refresh_token",
  });

  const data = await _postForm(url, body);

  if (data.error && !data.access_token) {
    throw new ZohoPaymentsException(`Token refresh failed: ${data.error}`);
  }

  if (!data.access_token) {
    throw new ZohoPaymentsException(
      `Token refresh response missing access_token: ${JSON.stringify(data)}`
    );
  }

  const expiresIn = Number(data.expires_in_sec ?? data.expires_in ?? 3600);
  return new OAuthToken(data.access_token as string, expiresIn);
}

/**
 * Revokes a refresh token.
 */
export async function revokeToken(params: {
  token: string;
  edition: Edition;
}): Promise<void> {
  const config = getEditionConfig(params.edition);
  const url = `${config.accountsUrl}/oauth/v2/token/revoke?token=${encodeURIComponent(params.token)}`;

  await _postForm(url, new URLSearchParams());
}

async function _postForm(
  url: string,
  body: URLSearchParams
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (err) {
    throw new ConnectionException(`OAuth request failed: ${String(err)}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new ZohoPaymentsException(
      `OAuth response was not valid JSON (HTTP ${response.status}): ${text.slice(0, 500)}`
    );
  }
}
