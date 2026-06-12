import {
  requireField,
  validateDescription,
  validateMetaData,
  serializeMetaData,
  serializeConfigurations,
  type MetaDataParams,
  type NotifyCustomerParams,
  type ConfigurationsParams,
} from "./common.js";

export interface PaymentLinkConfigurationsParams extends ConfigurationsParams {}

export interface PaymentLinkCreateParams {
  amount: number;
  currency: string;
  description: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  expiresAt?: string;
  referenceId?: string;
  returnUrl?: string;
  notifyCustomer?: NotifyCustomerParams;
  configurations?: PaymentLinkConfigurationsParams;
  metaData?: MetaDataParams[];
}

export interface PaymentLinkUpdateParams {
  amount?: number;
  currency?: string;
  description?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  expiresAt?: string;
  referenceId?: string;
  returnUrl?: string;
  notifyCustomer?: NotifyCustomerParams;
  configurations?: PaymentLinkConfigurationsParams;
  metaData?: MetaDataParams[];
}

export function serializePaymentLinkCreate(p: PaymentLinkCreateParams): Record<string, unknown> {
  requireField(p.amount, "amount");
  requireField(p.currency, "currency");
  requireField(p.description, "description");
  validateDescription(p.description);
  validateMetaData(p.metaData);

  const body: Record<string, unknown> = {
    amount: p.amount,
    currency: p.currency,
    description: p.description,
  };
  if (p.email !== undefined) body["email"] = p.email;
  if (p.phone !== undefined) body["phone"] = p.phone;
  if (p.phoneCountryCode !== undefined) body["phone_country_code"] = p.phoneCountryCode;
  if (p.expiresAt !== undefined) body["expires_at"] = p.expiresAt;
  if (p.referenceId !== undefined) body["reference_id"] = p.referenceId;
  if (p.returnUrl !== undefined) body["return_url"] = p.returnUrl;
  if (p.notifyCustomer !== undefined) {
    body["notify_customer"] = {
      email: p.notifyCustomer.email,
      sms: p.notifyCustomer.sms,
    };
  }
  if (p.configurations !== undefined) body["configurations"] = serializeConfigurations(p.configurations);
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}

export function serializePaymentLinkUpdate(p: PaymentLinkUpdateParams): Record<string, unknown> {
  validateDescription(p.description);
  validateMetaData(p.metaData);

  const body: Record<string, unknown> = {};
  if (p.amount !== undefined) body["amount"] = p.amount;
  if (p.currency !== undefined) body["currency"] = p.currency;
  if (p.description !== undefined) body["description"] = p.description;
  if (p.email !== undefined) body["email"] = p.email;
  if (p.phone !== undefined) body["phone"] = p.phone;
  if (p.phoneCountryCode !== undefined) body["phone_country_code"] = p.phoneCountryCode;
  if (p.expiresAt !== undefined) body["expires_at"] = p.expiresAt;
  if (p.referenceId !== undefined) body["reference_id"] = p.referenceId;
  if (p.returnUrl !== undefined) body["return_url"] = p.returnUrl;
  if (p.notifyCustomer !== undefined) {
    body["notify_customer"] = {
      email: p.notifyCustomer.email,
      sms: p.notifyCustomer.sms,
    };
  }
  if (p.configurations !== undefined) body["configurations"] = serializeConfigurations(p.configurations);
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}
