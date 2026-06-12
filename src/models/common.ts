import { optBool, optObj, optStr, optStrList } from "./_base.js";

export interface MetaData {
  key: string | undefined;
  value: string | undefined;
}

export function metaDataFromDict(data: Record<string, unknown>): MetaData {
  return { key: optStr(data, "key"), value: optStr(data, "value") };
}

export interface NotifyCustomer {
  email: boolean | undefined;
  sms: boolean | undefined;
}

export function notifyCustomerFromDict(data: Record<string, unknown>): NotifyCustomer {
  return {
    email: typeof data["email"] === "boolean" ? data["email"] : undefined,
    sms: typeof data["sms"] === "boolean" ? data["sms"] : undefined,
  };
}

export interface Configurations {
  paymentMethods: string[];
  partialPayment: boolean | undefined;
}

export function configurationsFromDict(data: Record<string, unknown>): Configurations {
  return {
    paymentMethods: optStrList(data, "payment_methods"),
    partialPayment: typeof data["partial_payment"] === "boolean" ? data["partial_payment"] : undefined,
  };
}

export interface HostedPageResponse {
  hostedPageId: string | undefined;
  url: string | undefined;
  expiresAt: string | undefined;
}

export function hostedPageResponseFromDict(data: Record<string, unknown>): HostedPageResponse {
  return {
    hostedPageId: optStr(data, "hosted_page_id"),
    url: optStr(data, "url"),
    expiresAt: optStr(data, "expires_at"),
  };
}

export interface PageContext {
  page: number | undefined;
  perPage: number | undefined;
  hasMorePage: boolean | undefined;
}

export function pageContextFromDict(data: Record<string, unknown>): PageContext {
  return {
    page: typeof data["page"] === "number" ? data["page"] : undefined,
    perPage: typeof data["per_page"] === "number" ? data["per_page"] : undefined,
    hasMorePage: typeof data["has_more_page"] === "boolean" ? data["has_more_page"] : undefined,
  };
}

export interface ListResponse<T> {
  items: T[];
  pageContext: PageContext | undefined;
}
