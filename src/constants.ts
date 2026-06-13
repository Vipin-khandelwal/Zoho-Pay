export const SDK_NAME = "zohopay-ts";
export const SDK_VERSION = "1.0.0";

export const DEFAULT_CONNECT_TIMEOUT_MS = 30_000;
export const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

export const OAUTH_SCOPES = {
  CUSTOMERS_CREATE: "ZohoPay.customers.CREATE",
  CUSTOMERS_READ: "ZohoPay.customers.READ",
  PAYMENTS_CREATE: "ZohoPay.payments.CREATE",
  PAYMENTS_READ: "ZohoPay.payments.READ",
  PAYMENTS_UPDATE: "ZohoPay.payments.UPDATE",
  REFUNDS_CREATE: "ZohoPay.refunds.CREATE",
  REFUNDS_READ: "ZohoPay.refunds.READ",
} as const;

export type OAuthScope = (typeof OAUTH_SCOPES)[keyof typeof OAUTH_SCOPES];
