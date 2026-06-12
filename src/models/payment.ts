import { optList, optNum, optObj, optStr } from "./_base.js";
import { metaDataFromDict, type MetaData } from "./common.js";

// ── Payment method detail (embedded in payments) ──────────────────────────────

export interface CardChecks {
  addressLineCheck: string | undefined;
  postalCodeCheck: string | undefined;
  cvcCheck: string | undefined;
}

export function cardChecksFromDict(data: Record<string, unknown>): CardChecks {
  return {
    addressLineCheck: optStr(data, "address_line_check"),
    postalCodeCheck: optStr(data, "postal_code_check"),
    cvcCheck: optStr(data, "cvc_check"),
  };
}

export interface CardDetail {
  cardHolderName: string | undefined;
  lastFourDigits: string | undefined;
  expiryMonth: string | undefined;
  expiryYear: string | undefined;
  brand: string | undefined;
  checks: CardChecks | undefined;
}

export function cardDetailFromDict(data: Record<string, unknown>): CardDetail {
  return {
    cardHolderName: optStr(data, "card_holder_name"),
    lastFourDigits: optStr(data, "last_four_digits"),
    expiryMonth: optStr(data, "expiry_month"),
    expiryYear: optStr(data, "expiry_year"),
    brand: optStr(data, "brand"),
    checks: optObj(data, "checks", cardChecksFromDict),
  };
}

export interface UpiDetail {
  vpa: string | undefined;
}

export function upiDetailFromDict(data: Record<string, unknown>): UpiDetail {
  return { vpa: optStr(data, "vpa") };
}

export interface NetBankingDetail {
  bankName: string | undefined;
  bankCode: string | undefined;
}

export function netBankingDetailFromDict(data: Record<string, unknown>): NetBankingDetail {
  return {
    bankName: optStr(data, "bank_name"),
    bankCode: optStr(data, "bank_code"),
  };
}

export interface AchDebitDetail {
  accountHolderName: string | undefined;
  lastFourDigits: string | undefined;
  accountHolderType: string | undefined;
  accountType: string | undefined;
  bankName: string | undefined;
  routingNumber: string | undefined;
}

export function achDebitDetailFromDict(data: Record<string, unknown>): AchDebitDetail {
  return {
    accountHolderName: optStr(data, "account_holder_name"),
    lastFourDigits: optStr(data, "last_four_digits"),
    accountHolderType: optStr(data, "account_holder_type"),
    accountType: optStr(data, "account_type"),
    bankName: optStr(data, "bank_name"),
    routingNumber: optStr(data, "routing_number"),
  };
}

export interface PaymentMethodDetail {
  type: string | undefined;
  card: CardDetail | undefined;
  upi: UpiDetail | undefined;
  netBanking: NetBankingDetail | undefined;
  achDebit: AchDebitDetail | undefined;
}

export function paymentMethodDetailFromDict(data: Record<string, unknown>): PaymentMethodDetail {
  return {
    type: optStr(data, "type"),
    card: optObj(data, "card", cardDetailFromDict),
    upi: optObj(data, "upi", upiDetailFromDict),
    netBanking: optObj(data, "net_banking", netBankingDetailFromDict),
    achDebit: optObj(data, "ach_debit", achDebitDetailFromDict),
  };
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface Payment {
  paymentId: string | undefined;
  phone: string | undefined;
  amount: string | undefined;
  currency: string | undefined;
  paymentsSessionId: string | undefined;
  receiptEmail: string | undefined;
  referenceNumber: string | undefined;
  transactionReferenceNumber: string | undefined;
  invoiceNumber: string | undefined;
  amountCaptured: string | undefined;
  amountRefunded: string | undefined;
  feeAmount: string | undefined;
  netTaxAmount: string | undefined;
  totalFeeAmount: string | undefined;
  netAmount: string | undefined;
  status: string | undefined;
  exchangeRate: number | undefined;
  statementDescriptor: string | undefined;
  description: string | undefined;
  date: number | undefined;
  paymentMethod: PaymentMethodDetail | undefined;
  metaData: MetaData[];
}

export function paymentFromDict(data: Record<string, unknown>): Payment {
  return {
    paymentId: optStr(data, "payment_id"),
    phone: optStr(data, "phone"),
    amount: optStr(data, "amount"),
    currency: optStr(data, "currency"),
    paymentsSessionId: optStr(data, "payments_session_id"),
    receiptEmail: optStr(data, "receipt_email"),
    referenceNumber: optStr(data, "reference_number"),
    transactionReferenceNumber: optStr(data, "transaction_reference_number"),
    invoiceNumber: optStr(data, "invoice_number"),
    amountCaptured: optStr(data, "amount_captured"),
    amountRefunded: optStr(data, "amount_refunded"),
    feeAmount: optStr(data, "fee_amount"),
    netTaxAmount: optStr(data, "net_tax_amount"),
    totalFeeAmount: optStr(data, "total_fee_amount"),
    netAmount: optStr(data, "net_amount"),
    status: optStr(data, "status"),
    exchangeRate: optNum(data, "exchange_rate"),
    statementDescriptor: optStr(data, "statement_descriptor"),
    description: optStr(data, "description"),
    date: optNum(data, "date"),
    paymentMethod: optObj(data, "payment_method", paymentMethodDetailFromDict),
    metaData: optList(data, "meta_data", metaDataFromDict),
  };
}

export interface PaymentSummary {
  paymentId: string | undefined;
  amount: string | undefined;
  currency: string | undefined;
  status: string | undefined;
  date: number | undefined;
}

export function paymentSummaryFromDict(data: Record<string, unknown>): PaymentSummary {
  return {
    paymentId: optStr(data, "payment_id"),
    amount: optStr(data, "amount"),
    currency: optStr(data, "currency"),
    status: optStr(data, "status"),
    date: optNum(data, "date"),
  };
}
