import { optList, optNum, optObj, optStr } from "./_base.js";
import { configurationsFromDict, metaDataFromDict, type Configurations, type MetaData } from "./common.js";

export interface PaymentLinkPayment {
  paymentId: string | undefined;
  status: string | undefined;
  createdTime: number | undefined;
}

export function paymentLinkPaymentFromDict(data: Record<string, unknown>): PaymentLinkPayment {
  return {
    paymentId: optStr(data, "payment_id"),
    status: optStr(data, "status"),
    createdTime: optNum(data, "created_time"),
  };
}

export interface PaymentLink {
  paymentLinkId: string | undefined;
  url: string | undefined;
  expiresAt: string | undefined;
  amount: string | undefined;
  amountPaid: string | undefined;
  currency: string | undefined;
  status: string | undefined;
  email: string | undefined;
  referenceId: string | undefined;
  description: string | undefined;
  returnUrl: string | undefined;
  phone: string | undefined;
  phoneCountryCode: string | undefined;
  createdTime: number | undefined;
  createdById: string | undefined;
  createdBy: string | undefined;
  lastModifiedById: string | undefined;
  lastModified: string | undefined;
  configurations: Configurations | undefined;
  payments: PaymentLinkPayment[];
  metaData: MetaData[];
}

export function paymentLinkFromDict(data: Record<string, unknown>): PaymentLink {
  return {
    paymentLinkId: optStr(data, "payment_link_id"),
    url: optStr(data, "url"),
    expiresAt: optStr(data, "expires_at"),
    amount: optStr(data, "amount"),
    amountPaid: optStr(data, "amount_paid"),
    currency: optStr(data, "currency"),
    status: optStr(data, "status"),
    email: optStr(data, "email"),
    referenceId: optStr(data, "reference_id"),
    description: optStr(data, "description"),
    returnUrl: optStr(data, "return_url"),
    phone: optStr(data, "phone"),
    phoneCountryCode: optStr(data, "phone_country_code"),
    createdTime: optNum(data, "created_time"),
    createdById: optStr(data, "created_by_id"),
    createdBy: optStr(data, "created_by"),
    lastModifiedById: optStr(data, "last_modified_by_id"),
    lastModified: optStr(data, "last_modified"),
    configurations: optObj(data, "configurations", configurationsFromDict),
    payments: optList(data, "payments", paymentLinkPaymentFromDict),
    metaData: optList(data, "meta_data", metaDataFromDict),
  };
}
