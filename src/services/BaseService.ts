import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import type { ListResponse, PageContext } from "../models/common.js";
import { pageContextFromDict } from "../models/common.js";
import { ZohoPaymentsException } from "../exceptions.js";

/**
 * Base class for all Zoho Payments services.
 * Provides shared helpers for unwrapping API envelopes.
 */
export abstract class BaseService {
  protected readonly _http: ZohoHttpClient;

  constructor(http: ZohoHttpClient) {
    this._http = http;
  }

  protected _unwrap<T>(
    body: Record<string, unknown>,
    key: string,
    fromDict: (d: Record<string, unknown>) => T
  ): T {
    const raw = this._firstObject(body, this._objectKeysFor(key));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return fromDict(raw as Record<string, unknown>);
    }

    if (this._looksLikeResource(body, key)) {
      return fromDict(body);
    }

    throw new ZohoPaymentsException(
      `Expected object at key "${key}" in API response`,
      { body }
    );
  }

  protected _unwrapList<T>(
    body: Record<string, unknown>,
    key: string,
    fromDict: (d: Record<string, unknown>) => T
  ): ListResponse<T> {
    const raw = body[key];
    const items: T[] = Array.isArray(raw)
      ? (raw as Record<string, unknown>[]).map(fromDict)
      : [];

    const pcRaw = body["page_context"];
    const pageContext: PageContext | undefined =
      pcRaw && typeof pcRaw === "object" && !Array.isArray(pcRaw)
        ? pageContextFromDict(pcRaw as Record<string, unknown>)
        : undefined;

    return { items, pageContext };
  }

  private _looksLikeResource(body: Record<string, unknown>, key: string): boolean {
    const idKeys: Record<string, string> = {
      customer: "customer_id",
      payment: "payment_id",
      payment_link: "payment_link_id",
      payments_session: "payments_session_id",
      refund: "refund_id",
    };
    const idKey = idKeys[key];
    return idKey !== undefined && body[idKey] !== undefined;
  }

  private _objectKeysFor(key: string): string[] {
    const aliases: Record<string, string[]> = {
      payment_link: ["payment_link", "payment_links"],
      payments_session: ["payments_session", "payment_session", "payments_sessions"],
    };
    return aliases[key] ?? [key];
  }

  private _firstObject(body: Record<string, unknown>, keys: string[]): Record<string, unknown> | undefined {
    for (const key of keys) {
      const value = body[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    }
    return undefined;
  }
}
