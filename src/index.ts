// ── Core ──────────────────────────────────────────────────────────────────────
export { ZohoPayments } from "./ZohoPayments.js";
export { ZohoPaymentsClientBuilder } from "./ZohoPayments.js";
export { ZohoPaymentsClient } from "./ZohoPaymentsClient.js";
export type { ZohoPaymentsClientOptions } from "./ZohoPaymentsClient.js";

// ── Edition ───────────────────────────────────────────────────────────────────
export { Edition, getEditionConfig, isInEdition, isUsEdition } from "./edition.js";
export type { EditionConfig } from "./edition.js";

// ── Constants ─────────────────────────────────────────────────────────────────
export { OAUTH_SCOPES, SDK_NAME, SDK_VERSION } from "./constants.js";
export type { OAuthScope } from "./constants.js";

// ── Auth ──────────────────────────────────────────────────────────────────────
export { OAuthToken, TokenManager } from "./auth/index.js";
export {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  generateAccessToken,
  parseOAuthCallback,
  revokeToken,
} from "./auth/index.js";
export type {
  ExchangeCodeForTokenParams,
  ExchangeCodeForTokenResult,
  GenerateAccessTokenParams,
  GenerateAuthorizationUrlParams,
  ParseOAuthCallbackResult,
  RevokeTokenParams,
} from "./auth/index.js";

// ── Exceptions ────────────────────────────────────────────────────────────────
export {
  ZohoPaymentsException,
  ConnectionException,
  ZohoPaymentsAPIException,
  AuthenticationException,
  PermissionException,
  ResourceNotFoundException,
  InvalidRequestException,
  RateLimitException,
} from "./exceptions.js";

// ── Models ────────────────────────────────────────────────────────────────────
export type {
  MetaData,
  NotifyCustomer,
  Configurations,
  HostedPageResponse,
  PageContext,
  ListResponse,
} from "./models/common.js";
export type { PaymentLink, PaymentLinkPayment } from "./models/payment-link.js";
export type { PaymentSession, PaymentSessionPayment } from "./models/payment-session.js";
export type { Mandate, MandateNotification } from "./models/mandate.js";
export type {
  Payment,
  PaymentSummary,
  PaymentMethodDetail,
  CardDetail,
  CardChecks,
  UpiDetail,
  NetBankingDetail,
  AchDebitDetail,
} from "./models/payment.js";
export type { Customer, CustomerSummary, CustomerPaymentMethod } from "./models/customer.js";
export type { Refund } from "./models/refund.js";

// ── Params ────────────────────────────────────────────────────────────────────
export type {
  MetaDataParams,
  NotifyCustomerParams,
  ConfigurationsParams,
  PaginationParams,
  PostalAddressParams,
} from "./params/common.js";
export type {
  PaymentLinkCreateParams,
  PaymentLinkUpdateParams,
  PaymentLinkConfigurationsParams,
} from "./params/payment-link.js";
export type { PaymentSessionCreateParams } from "./params/payment-session.js";
export type {
  MandateAmountRule,
  MandateAutoExecuteParams,
  MandateDebitRule,
  MandateDetailsParams,
  MandateEnrollmentSessionParams,
  MandateExecutionSessionParams,
  MandateExecuteParams,
  MandateFrequency,
  MandateNotifyParams,
  MandatePaymentMethodType,
} from "./params/mandate.js";
export type { PaymentCreateParams, PaymentListParams, BrowserInfo } from "./params/payment.js";
export type { CustomerCreateParams, CustomerListParams } from "./params/customer.js";
export type { RefundCreateParams } from "./params/refund.js";

// ── Services ──────────────────────────────────────────────────────────────────
export { PaymentLinkService } from "./services/PaymentLinkService.js";
export { PaymentSessionService } from "./services/PaymentSessionService.js";
export { MandateService } from "./services/MandateService.js";
export { PaymentService } from "./services/PaymentService.js";
export { CustomerService } from "./services/CustomerService.js";
export { RefundService } from "./services/RefundService.js";

// ── Net (extensibility) ───────────────────────────────────────────────────────
export type { HttpTransport, ZohoRequest, ZohoResponse } from "./net/types.js";
export { DefaultHttpTransport } from "./net/DefaultHttpTransport.js";
export type { DefaultHttpTransportOptions } from "./net/DefaultHttpTransport.js";
