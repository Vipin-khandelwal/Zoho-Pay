import {
  requireField,
  validateMetaData,
  serializeMetaData,
  type MetaDataParams,
} from "./common.js";

export interface RefundCreateParams {
  amount: number;
  reason: string;
  type: "initiated_by_merchant" | "initiated_by_customer" | "initiated_by_system";
  description?: string;
  referenceNumber?: string;
  metaData?: MetaDataParams[];
}

export function serializeRefundCreate(p: RefundCreateParams): Record<string, unknown> {
  requireField(p.amount, "amount");
  requireField(p.reason, "reason");
  requireField(p.type, "type");
  validateMetaData(p.metaData);

  const body: Record<string, unknown> = {
    amount: p.amount,
    reason: p.reason,
    type: p.type,
  };
  if (p.description !== undefined) body["description"] = p.description;
  if (p.referenceNumber !== undefined) body["reference_number"] = p.referenceNumber;
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}
