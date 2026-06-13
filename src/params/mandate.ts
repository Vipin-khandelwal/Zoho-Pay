import {
  requireField,
  validateDescription,
  validateMetaData,
  serializeMetaData,
  serializeConfigurations,
  type ConfigurationsParams,
  type MetaDataParams,
} from "./common.js";

export interface MandateDetailsParams {
  paymentMethodType: "upi" | "card" | string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "half_yearly" | "yearly" | string;
  description: string;
  amountRule: "fixed" | "variable" | string;
  maxAmount?: number;
  amount?: number;
  startDate: string;
  endDate?: string;
  debitDay?: number;
  debitRule?: "on" | "before" | "after" | string;
}

export type MandatePaymentMethodType = "upi" | "card" | string;
export type MandateFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "half_yearly" | "yearly" | string;
export type MandateAmountRule = "fixed" | "variable" | string;
export type MandateDebitRule = "on" | "before" | "after" | string;

export interface MandateEnrollmentSessionParams {
  amount: number;
  currency: string;
  customerId: string;
  description: string;
  invoiceNumber?: string;
  maxRetryCount?: number;
  configurations?: ConfigurationsParams;
  mandateDetails: MandateDetailsParams;
  metaData?: MetaDataParams[];
}

export interface MandateExecutionSessionParams {
  amount: number;
  currency: string;
  customerId: string;
  description: string;
  invoiceNumber: string;
  maxRetryCount?: number;
  metaData?: MetaDataParams[];
}

export interface MandateNotifyParams {
  mandateId: string | number;
  amount: number;
  executionDate: string;
  description: string;
  invoiceNumber: string;
}

export interface MandateExecuteParams {
  customerId: string | number;
  mandateId: string | number;
  paymentsSessionId: string | number;
  invoiceNumber: string;
  amount: number;
  mandateNotificationId?: string | number;
  receiptEmail?: string;
  phone?: string;
  phoneCountryCode?: string;
  description?: string;
  referenceNumber?: string;
}

export interface MandateAutoExecuteParams extends Omit<MandateExecuteParams, "mandateNotificationId"> {}

export function serializeMandateEnrollmentSession(p: MandateEnrollmentSessionParams): Record<string, unknown> {
  validateMandateSessionBase(p);
  requireField(p.mandateDetails, "mandateDetails");
  validateMandateDetails(p.mandateDetails);

  return {
    ...serializeMandateSessionBase(p, "mandate_enrollment"),
    mandate_details: serializeMandateDetails(p.mandateDetails),
  };
}

export function serializeMandateExecutionSession(p: MandateExecutionSessionParams): Record<string, unknown> {
  validateMandateSessionBase(p);
  requireField(p.invoiceNumber, "invoiceNumber");
  return serializeMandateSessionBase(p, "mandate_execution");
}

export function serializeMandateNotify(p: MandateNotifyParams): Record<string, unknown> {
  requireField(p.mandateId, "mandateId");
  requireField(p.amount, "amount");
  requireField(p.executionDate, "executionDate");
  requireField(p.description, "description");
  requireField(p.invoiceNumber, "invoiceNumber");
  validateDescription(p.description);
  return {
    mandate_id: p.mandateId,
    amount: p.amount,
    execution_date: p.executionDate,
    description: p.description,
    invoice_number: p.invoiceNumber,
  };
}

export function serializeMandateExecute(p: MandateExecuteParams): Record<string, unknown> {
  requireField(p.customerId, "customerId");
  requireField(p.mandateId, "mandateId");
  requireField(p.paymentsSessionId, "paymentsSessionId");
  requireField(p.invoiceNumber, "invoiceNumber");
  requireField(p.amount, "amount");
  validateDescription(p.description);
  const body: Record<string, unknown> = {
    customer_id: p.customerId,
    mandate_id: p.mandateId,
    payments_session_id: p.paymentsSessionId,
    invoice_number: p.invoiceNumber,
    amount: p.amount,
  };
  if (p.mandateNotificationId !== undefined) body["mandate_notification_id"] = p.mandateNotificationId;
  if (p.receiptEmail !== undefined) body["receipt_email"] = p.receiptEmail;
  if (p.phone !== undefined) body["phone"] = p.phone;
  if (p.phoneCountryCode !== undefined) body["phone_country_code"] = p.phoneCountryCode;
  if (p.description !== undefined) body["description"] = p.description;
  if (p.referenceNumber !== undefined) body["reference_number"] = p.referenceNumber;
  return body;
}

export function serializeMandateAutoExecute(p: MandateAutoExecuteParams): Record<string, unknown> {
  return serializeMandateExecute(p);
}

function validateMandateSessionBase(p: MandateEnrollmentSessionParams | MandateExecutionSessionParams): void {
  requireField(p.amount, "amount");
  requireField(p.currency, "currency");
  requireField(p.customerId, "customerId");
  requireField(p.description, "description");
  validateDescription(p.description);
  validateMetaData(p.metaData);
  if (p.currency.length !== 3) {
    throw new Error("currency must be a 3-letter ISO currency code");
  }
  if (p.maxRetryCount !== undefined && (p.maxRetryCount < 1 || p.maxRetryCount > 3)) {
    throw new Error("maxRetryCount must be between 1 and 3 for mandates");
  }
}

function serializeMandateSessionBase(
  p: MandateEnrollmentSessionParams | MandateExecutionSessionParams,
  type: "mandate_enrollment" | "mandate_execution"
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    amount: p.amount,
    currency: p.currency,
    customer_id: p.customerId,
    type,
    description: p.description,
  };
  if (p.invoiceNumber !== undefined) body["invoice_number"] = p.invoiceNumber;
  if (p.maxRetryCount !== undefined) body["max_retry_count"] = p.maxRetryCount;
  if ("configurations" in p && p.configurations !== undefined) body["configurations"] = serializeConfigurations(p.configurations);
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}

function validateMandateDetails(p: MandateDetailsParams): void {
  requireField(p.paymentMethodType, "mandateDetails.paymentMethodType");
  requireField(p.frequency, "mandateDetails.frequency");
  requireField(p.description, "mandateDetails.description");
  requireField(p.amountRule, "mandateDetails.amountRule");
  requireField(p.startDate, "mandateDetails.startDate");
  validateDescription(p.description);
  if (p.amountRule === "fixed" && p.amount === undefined) {
    throw new Error("mandateDetails.amount is required when amountRule is fixed");
  }
  if (p.amountRule === "variable" && p.maxAmount === undefined) {
    throw new Error("mandateDetails.maxAmount is required when amountRule is variable");
  }
}

function serializeMandateDetails(p: MandateDetailsParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    payment_method_type: p.paymentMethodType,
    frequency: p.frequency,
    description: p.description,
    amount_rule: p.amountRule,
    start_date: p.startDate,
  };
  if (p.maxAmount !== undefined) body["max_amount"] = p.maxAmount;
  if (p.amount !== undefined) body["amount"] = p.amount;
  if (p.endDate !== undefined) body["end_date"] = p.endDate;
  if (p.debitDay !== undefined) body["debit_day"] = p.debitDay;
  if (p.debitRule !== undefined) body["debit_rule"] = p.debitRule;
  return body;
}