import {
  requireField,
  validateDescription,
  validateMetaData,
  serializeMetaData,
  serializePostalAddress,
  type MetaDataParams,
  type PostalAddressParams,
  type PaginationParams,
} from "./common.js";

export interface BrowserInfo {
  userAgent?: string;
  acceptHeader?: string;
  screenHeight?: number;
  screenWidth?: number;
  language?: string;
  timeZoneOffset?: number;
  colorDepth?: number;
}

export interface PaymentCreateParams {
  customerId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  customerOnSession?: boolean;
  browserInfo?: BrowserInfo;
  statementDescriptor?: string;
  description?: string;
  shippingAddress?: PostalAddressParams;
  metaData?: MetaDataParams[];
}

export interface PaymentListParams extends PaginationParams {
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export function serializePaymentCreate(p: PaymentCreateParams): Record<string, unknown> {
  requireField(p.customerId, "customerId");
  requireField(p.paymentMethodId, "paymentMethodId");
  requireField(p.amount, "amount");
  requireField(p.currency, "currency");
  validateDescription(p.description);
  validateMetaData(p.metaData);

  const body: Record<string, unknown> = {
    customer_id: p.customerId,
    payment_method_id: p.paymentMethodId,
    amount: p.amount,
    currency: p.currency,
  };
  if (p.customerOnSession !== undefined) body["customer_on_session"] = p.customerOnSession;
  if (p.browserInfo !== undefined) {
    const bi: Record<string, unknown> = {};
    if (p.browserInfo.userAgent !== undefined) bi["user_agent"] = p.browserInfo.userAgent;
    if (p.browserInfo.acceptHeader !== undefined) bi["accept_header"] = p.browserInfo.acceptHeader;
    if (p.browserInfo.screenHeight !== undefined) bi["screen_height"] = p.browserInfo.screenHeight;
    if (p.browserInfo.screenWidth !== undefined) bi["screen_width"] = p.browserInfo.screenWidth;
    if (p.browserInfo.language !== undefined) bi["language"] = p.browserInfo.language;
    if (p.browserInfo.timeZoneOffset !== undefined) bi["time_zone_offset"] = p.browserInfo.timeZoneOffset;
    if (p.browserInfo.colorDepth !== undefined) bi["color_depth"] = p.browserInfo.colorDepth;
    body["browser_info"] = bi;
  }
  if (p.statementDescriptor !== undefined) body["statement_descriptor"] = p.statementDescriptor;
  if (p.description !== undefined) body["description"] = p.description;
  if (p.shippingAddress !== undefined) body["shipping_address"] = serializePostalAddress(p.shippingAddress);
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}
