import { BaseService } from "./BaseService.js";
import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import { type PaymentSession, paymentSessionFromDict } from "../models/payment-session.js";
import {
  type PaymentSessionCreateParams,
  serializePaymentSessionCreate,
} from "../params/payment-session.js";

export class PaymentSessionService extends BaseService {
  constructor(http: ZohoHttpClient) {
    super(http);
  }

  async create(params: PaymentSessionCreateParams): Promise<PaymentSession> {
    const body = serializePaymentSessionCreate(params);
    const res = await this._http.post("/paymentssessions", body);
    return this._unwrap(res.body, "payments_session", paymentSessionFromDict);
  }

  async get(sessionId: string): Promise<PaymentSession> {
    const res = await this._http.get(`/paymentssessions/${encodeURIComponent(sessionId)}`);
    return this._unwrap(res.body, "payments_session", paymentSessionFromDict);
  }
}
