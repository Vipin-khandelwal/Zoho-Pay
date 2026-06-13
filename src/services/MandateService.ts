import { BaseService } from "./BaseService.js";
import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import { type Payment, paymentFromDict } from "../models/payment.js";
import { type PaymentSession, paymentSessionFromDict } from "../models/payment-session.js";
import { type Mandate, mandateFromDict, type MandateNotification, mandateNotificationFromDict } from "../models/mandate.js";
import {
  type MandateEnrollmentSessionParams,
  type MandateExecutionSessionParams,
  type MandateAutoExecuteParams,
  type MandateExecuteParams,
  type MandateNotifyParams,
  serializeMandateAutoExecute,
  serializeMandateEnrollmentSession,
  serializeMandateExecutionSession,
  serializeMandateExecute,
  serializeMandateNotify,
} from "../params/mandate.js";

export class MandateService extends BaseService {
  constructor(http: ZohoHttpClient) {
    super(http);
  }

  async createEnrollmentSession(params: MandateEnrollmentSessionParams): Promise<PaymentSession> {
    const res = await this._http.post("/paymentsessions", serializeMandateEnrollmentSession(params));
    return this._unwrap(res.body, "payments_session", paymentSessionFromDict);
  }

  async createExecutionSession(params: MandateExecutionSessionParams): Promise<PaymentSession> {
    const res = await this._http.post("/paymentsessions", serializeMandateExecutionSession(params));
    return this._unwrap(res.body, "payments_session", paymentSessionFromDict);
  }

  async notify(params: MandateNotifyParams): Promise<MandateNotification> {
    const res = await this._http.post("/mandates/notify", serializeMandateNotify(params));
    return this._unwrap(res.body, "mandate_notification", mandateNotificationFromDict);
  }

  async execute(params: MandateExecuteParams): Promise<Payment> {
    const res = await this._http.post("/mandates/execute", serializeMandateExecute(params));
    return this._unwrap(res.body, "payment", paymentFromDict);
  }

  /**
   * Execute a mandate without a pre-created notification.
   * Zoho sends the notification when this API is triggered and processes the
   * debit automatically after 24 hours.
   */
  async autoExecute(params: MandateAutoExecuteParams): Promise<Payment> {
    const res = await this._http.post("/mandates/execute", serializeMandateAutoExecute(params));
    return this._unwrap(res.body, "payment", paymentFromDict);
  }

  async getNotification(mandateNotificationId: string): Promise<MandateNotification> {
    const res = await this._http.get(`/mandates/notifications/${encodeURIComponent(mandateNotificationId)}`);
    return this._unwrap(res.body, "mandate_notification", mandateNotificationFromDict);
  }

  async get(mandateId: string): Promise<Mandate> {
    const res = await this._http.get(`/mandates/${encodeURIComponent(mandateId)}`);
    return this._unwrap(res.body, "mandate", mandateFromDict);
  }
}