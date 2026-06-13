/** Shared param types and validators */

export interface MetaDataParams {
  key: string;
  value: string;
}

export interface NotifyCustomerParams {
  email?: boolean;
  sms?: boolean;
}

export interface ConfigurationsParams {
  allowedPaymentMethods?: string[];
  paymentMethods?: string[];
  partialPayment?: boolean;
  hostedCheckoutParameters?: HostedCheckoutParametersParams;
}

export interface HostedCheckoutParametersParams {
  phoneCountryCode?: string;
  phone?: string;
  name?: string;
  email?: string;
  description?: string;
  successUrl?: string;
  failureUrl?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface PostalAddressParams {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

// ── Serialization helpers ─────────────────────────────────────────────────────

export function serializeMetaData(items: MetaDataParams[]): Array<{ key: string; value: string }> {
  return items.map(({ key, value }) => ({ key, value }));
}

export function serializeConfigurations(c: ConfigurationsParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.allowedPaymentMethods !== undefined) out["allowed_payment_methods"] = c.allowedPaymentMethods;
  if (c.paymentMethods !== undefined) out["payment_methods"] = c.paymentMethods;
  if (c.partialPayment !== undefined) out["partial_payment"] = c.partialPayment;
  if (c.hostedCheckoutParameters !== undefined) {
    out["hosted_checkout_parameters"] = serializeHostedCheckoutParameters(c.hostedCheckoutParameters);
  }
  return out;
}

export function serializeHostedCheckoutParameters(c: HostedCheckoutParametersParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.phoneCountryCode !== undefined) out["phone_country_code"] = c.phoneCountryCode;
  if (c.phone !== undefined) out["phone"] = c.phone;
  if (c.name !== undefined) out["name"] = c.name;
  if (c.email !== undefined) out["email"] = c.email;
  if (c.description !== undefined) out["description"] = c.description;
  if (c.successUrl !== undefined) out["success_url"] = c.successUrl;
  if (c.failureUrl !== undefined) out["failure_url"] = c.failureUrl;
  if (c.udf1 !== undefined) out["udf1"] = c.udf1;
  if (c.udf2 !== undefined) out["udf2"] = c.udf2;
  if (c.udf3 !== undefined) out["udf3"] = c.udf3;
  if (c.udf4 !== undefined) out["udf4"] = c.udf4;
  if (c.udf5 !== undefined) out["udf5"] = c.udf5;
  return out;
}

export function serializePostalAddress(a: PostalAddressParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (a.line1 !== undefined) out["line1"] = a.line1;
  if (a.line2 !== undefined) out["line2"] = a.line2;
  if (a.city !== undefined) out["city"] = a.city;
  if (a.state !== undefined) out["state"] = a.state;
  if (a.country !== undefined) out["country"] = a.country;
  if (a.zip !== undefined) out["zip"] = a.zip;
  return out;
}

// ── Validators ────────────────────────────────────────────────────────────────

export function requireField(value: unknown, name: string): void {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${name} is required`);
  }
}

export function validateMetaData(items?: MetaDataParams[]): void {
  if (!items) return;
  if (items.length > 10) {
    throw new Error("meta_data cannot have more than 10 entries");
  }
  for (const item of items) {
    if (!item.key) throw new Error("meta_data entry key must not be empty");
    if (item.key.length > 100) throw new Error("meta_data key must be ≤ 100 characters");
    if (item.value.length > 500) throw new Error("meta_data value must be ≤ 500 characters");
  }
}

export function validateDescription(description?: string): void {
  if (description !== undefined && description.length > 500) {
    throw new Error("description must be ≤ 500 characters");
  }
}
