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
  transferDetails?: PaymentSessionTransferDetailParams[];
  invoiceNumber?: string;
  referenceNumber?: string;
  maxRetryCount?: number;
  configurations?: ConfigurationsParams;
  metaData?: MetaDataParams[];
}

export interface PaymentSessionTransferDetailParams {
  connectedAccountId: number | string;
  amount: number;
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
  if (p.transferDetails !== undefined) {
    for (const item of p.transferDetails) {
      requireField(item.connectedAccountId, "transferDetails.connectedAccountId");
      requireField(item.amount, "transferDetails.amount");
    }
  }

  const body: Record<string, unknown> = {
    amount: p.amount,
    currency: p.currency,
    description: p.description,
  };
  if (p.expiresIn !== undefined) body["expires_in"] = p.expiresIn;
  if (p.transferDetails !== undefined) {
    body["transfer_details"] = p.transferDetails.map((item) => ({
      connected_account_id: item.connectedAccountId,
      amount: item.amount,
    }));
  }
  if (p.invoiceNumber !== undefined) body["invoice_number"] = p.invoiceNumber;
  if (p.referenceNumber !== undefined) body["reference_number"] = p.referenceNumber;
  if (p.maxRetryCount !== undefined) body["max_retry_count"] = p.maxRetryCount;
  if (p.configurations !== undefined) body["configurations"] = serializeConfigurations(p.configurations);
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}
