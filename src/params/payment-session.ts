import {
  requireField,
  validateDescription,
  validateMetaData,
  serializeMetaData,
  serializeConfigurations,
  type MetaDataParams,
  type ConfigurationsParams,
} from "./common.js";

export interface PaymentSessionCreateParams {
  amount: number;
  currency: string;
  description: string;
  expiresIn?: number;
  invoiceNumber?: string;
  referenceNumber?: string;
  maxRetryCount?: number;
  configurations?: ConfigurationsParams;
  metaData?: MetaDataParams[];
}

export function serializePaymentSessionCreate(p: PaymentSessionCreateParams): Record<string, unknown> {
  requireField(p.amount, "amount");
  requireField(p.currency, "currency");
  requireField(p.description, "description");
  validateDescription(p.description);
  validateMetaData(p.metaData);

  if (p.expiresIn !== undefined && (p.expiresIn < 300 || p.expiresIn > 900)) {
    throw new Error("expiresIn must be between 300 and 900 seconds");
  }
  if (p.maxRetryCount !== undefined && (p.maxRetryCount < 1 || p.maxRetryCount > 5)) {
    throw new Error("maxRetryCount must be between 1 and 5");
  }

  const body: Record<string, unknown> = {
    amount: p.amount,
    currency: p.currency,
    description: p.description,
  };
  if (p.expiresIn !== undefined) body["expires_in"] = p.expiresIn;
  if (p.invoiceNumber !== undefined) body["invoice_number"] = p.invoiceNumber;
  if (p.referenceNumber !== undefined) body["reference_number"] = p.referenceNumber;
  if (p.maxRetryCount !== undefined) body["max_retry_count"] = p.maxRetryCount;
  if (p.configurations !== undefined) body["configurations"] = serializeConfigurations(p.configurations);
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}
