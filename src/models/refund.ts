import { optList, optNum, optStr } from "./_base.js";
import { metaDataFromDict, type MetaData } from "./common.js";

export interface Refund {
  refundId: string | undefined;
  paymentId: string | undefined;
  amount: string | undefined;
  currency: string | undefined;
  status: string | undefined;
  reason: string | undefined;
  type: string | undefined;
  referenceNumber: string | undefined;
  createdTime: number | undefined;
  lastModifiedTime: number | undefined;
  metaData: MetaData[];
}

export function refundFromDict(data: Record<string, unknown>): Refund {
  return {
    refundId: optStr(data, "refund_id"),
    paymentId: optStr(data, "payment_id"),
    amount: optStr(data, "amount"),
    currency: optStr(data, "currency"),
    status: optStr(data, "status"),
    reason: optStr(data, "reason"),
    type: optStr(data, "type"),
    referenceNumber: optStr(data, "reference_number"),
    createdTime: optNum(data, "created_time"),
    lastModifiedTime: optNum(data, "last_modified_time"),
    metaData: optList(data, "meta_data", metaDataFromDict),
  };
}
