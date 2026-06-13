import { optNum, optObj, optStr } from "./_base.js";
import { paymentMethodDetailFromDict, type PaymentMethodDetail } from "./payment.js";

export interface Mandate {
  mandateId: string | undefined;
  customerId: string | undefined;
  customerName: string | undefined;
  customerEmail: string | undefined;
  customerPhone: string | undefined;
  amount: string | undefined;
  currency: string | undefined;
  amountRule: string | undefined;
  frequency: string | undefined;
  debitDay: number | undefined;
  debitRule: string | undefined;
  startDate: number | undefined;
  endDate: number | undefined;
  status: string | undefined;
  description: string | undefined;
  paymentMethod: PaymentMethodDetail | undefined;
}

export function mandateFromDict(data: Record<string, unknown>): Mandate {
  return {
    mandateId: optStr(data, "mandate_id"),
    customerId: optStr(data, "customer_id"),
    customerName: optStr(data, "customer_name"),
    customerEmail: optStr(data, "customer_email"),
    customerPhone: optStr(data, "customer_phone"),
    amount: optStr(data, "amount"),
    currency: optStr(data, "currency"),
    amountRule: optStr(data, "amount_rule"),
    frequency: optStr(data, "frequency"),
    debitDay: optNum(data, "debit_day"),
    debitRule: optStr(data, "debit_rule"),
    startDate: optNum(data, "start_date"),
    endDate: optNum(data, "end_date"),
    status: optStr(data, "status"),
    description: optStr(data, "description"),
    paymentMethod: optObj(data, "payment_method", paymentMethodDetailFromDict),
  };
}

export interface MandateNotification {
  mandateId: string | undefined;
  mandateNotificationId: string | undefined;
  customerId: string | undefined;
  amount: string | undefined;
  mandateAmount: string | undefined;
  currency: string | undefined;
  amountRule: string | undefined;
  notificationAmount: string | undefined;
  notificationStatus: string | undefined;
  description: string | undefined;
  invoiceNumber: string | undefined;
  notificationDate: number | undefined;
  executionDate: number | undefined;
  paymentMethod: PaymentMethodDetail | undefined;
}

export function mandateNotificationFromDict(data: Record<string, unknown>): MandateNotification {
  return {
    mandateId: optStr(data, "mandate_id"),
    mandateNotificationId: optStr(data, "mandate_notification_id"),
    customerId: optStr(data, "customer_id"),
    amount: optStr(data, "amount"),
    mandateAmount: optStr(data, "mandate_amount"),
    currency: optStr(data, "currency"),
    amountRule: optStr(data, "amount_rule"),
    notificationAmount: optStr(data, "notification_amount") ?? optStr(data, "amount"),
    notificationStatus: optStr(data, "notification_status"),
    description: optStr(data, "description"),
    invoiceNumber: optStr(data, "invoice_number"),
    notificationDate: optNum(data, "notification_date"),
    executionDate: optNum(data, "execution_date"),
    paymentMethod: optObj(data, "payment_method", paymentMethodDetailFromDict),
  };
}