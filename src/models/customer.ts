import { optList, optNum, optObj, optStr } from "./_base.js";
import { metaDataFromDict, type MetaData } from "./common.js";
import { cardDetailFromDict, achDebitDetailFromDict, type CardDetail, type AchDebitDetail } from "./payment.js";

export interface CustomerPaymentMethod {
  paymentMethodId: string | undefined;
  type: string | undefined;
  status: string | undefined;
  card: CardDetail | undefined;
  achDebit: AchDebitDetail | undefined;
}

export function customerPaymentMethodFromDict(data: Record<string, unknown>): CustomerPaymentMethod {
  return {
    paymentMethodId: optStr(data, "payment_method_id"),
    type: optStr(data, "type"),
    status: optStr(data, "status"),
    card: optObj(data, "card", cardDetailFromDict),
    achDebit: optObj(data, "ach_debit", achDebitDetailFromDict),
  };
}

export interface Customer {
  customerId: string | undefined;
  name: string | undefined;
  email: string | undefined;
  phone: string | undefined;
  dialingCode: string | undefined;
  createdTime: number | undefined;
  lastModifiedTime: number | undefined;
  metaData: MetaData[];
  paymentMethods: CustomerPaymentMethod[];
}

export function customerFromDict(data: Record<string, unknown>): Customer {
  return {
    customerId: optStr(data, "customer_id"),
    name: optStr(data, "name"),
    email: optStr(data, "email"),
    phone: optStr(data, "phone"),
    dialingCode: optStr(data, "dialing_code"),
    createdTime: optNum(data, "created_time"),
    lastModifiedTime: optNum(data, "last_modified_time"),
    metaData: optList(data, "meta_data", metaDataFromDict),
    paymentMethods: optList(data, "payment_methods", customerPaymentMethodFromDict),
  };
}

export interface CustomerSummary {
  customerId: string | undefined;
  name: string | undefined;
  email: string | undefined;
}

export function customerSummaryFromDict(data: Record<string, unknown>): CustomerSummary {
  return {
    customerId: optStr(data, "customer_id"),
    name: optStr(data, "name"),
    email: optStr(data, "email"),
  };
}
