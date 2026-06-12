import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import type { ListResponse, PageContext } from "../models/common.js";
import { pageContextFromDict } from "../models/common.js";

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
    const raw = body[key];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`Expected object at key "${key}" in API response`);
    }
    return fromDict(raw as Record<string, unknown>);
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
}
