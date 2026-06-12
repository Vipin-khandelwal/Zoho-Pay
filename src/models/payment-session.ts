import { optList, optNum, optObj, optStr } from "./_base.js";
import { configurationsFromDict, metaDataFromDict, type Configurations, type MetaData } from "./common.js";

export interface PaymentSessionPayment {
  paymentId: string | undefined;
  status: string | undefined;
  createdTime: number | undefined;
}

export function paymentSessionPaymentFromDict(data: Record<string, unknown>): PaymentSessionPayment {
  return {
    paymentId: optStr(data, "payment_id"),
    status: optStr(data, "status"),
    createdTime: optNum(data, "created_time"),
  };
}

export interface PaymentSession {
  paymentsSessionId: string | undefined;
  accessKey: string | undefined;
  currency: string | undefined;
  amount: string | undefined;
  status: string | undefined;
  createdTime: number | undefined;
  expiryTime: number | undefined;
  description: string | undefined;
  invoiceNumber: string | undefined;
  referenceNumber: string | undefined;
  maxRetryCount: number | undefined;
  configurations: Configurations | undefined;
  payments: PaymentSessionPayment[];
  metaData: MetaData[];
}

export function paymentSessionFromDict(data: Record<string, unknown>): PaymentSession {
  return {
    paymentsSessionId: optStr(data, "payments_session_id"),
    accessKey: optStr(data, "access_key"),
    currency: optStr(data, "currency"),
    amount: optStr(data, "amount"),
    status: optStr(data, "status"),
    createdTime: optNum(data, "created_time"),
    expiryTime: optNum(data, "expiry_time"),
    description: optStr(data, "description"),
    invoiceNumber: optStr(data, "invoice_number"),
    referenceNumber: optStr(data, "reference_number"),
    maxRetryCount: optNum(data, "max_retry_count"),
    configurations: optObj(data, "configurations", configurationsFromDict),
    payments: optList(data, "payments", paymentSessionPaymentFromDict),
    metaData: optList(data, "meta_data", metaDataFromDict),
  };
}
