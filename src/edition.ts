/**
 * Zoho Payments API editions.
 * Each edition maps to a distinct API base URL and accounts (IAM) URL.
 */
export enum Edition {
  /** India production */
  IN = "IN",
  /** India sandbox */
  IN_SANDBOX = "IN_SANDBOX",
  /** United States production */
  US = "US",
}

export interface EditionConfig {
  readonly apiBaseUrl: string;
  readonly accountsUrl: string;
}

const EDITION_CONFIGS: Record<Edition, EditionConfig> = {
  [Edition.IN]: {
    apiBaseUrl: "https://payments.zoho.in/api/v1",
    accountsUrl: "https://accounts.zoho.in",
  },
  [Edition.IN_SANDBOX]: {
    apiBaseUrl: "https://paymentssandbox.zoho.in/api/v1",
    accountsUrl: "https://accounts.zoho.in",
  },
  [Edition.US]: {
    apiBaseUrl: "https://payments.zoho.com/api/v1",
    accountsUrl: "https://accounts.zoho.com",
  },
};

export function getEditionConfig(edition: Edition): EditionConfig {
  return EDITION_CONFIGS[edition];
}

export function isInEdition(edition: Edition): boolean {
  return edition === Edition.IN || edition === Edition.IN_SANDBOX;
}

export function isUsEdition(edition: Edition): boolean {
  return edition === Edition.US;
}
