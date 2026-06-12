import { BaseService } from "./BaseService.js";
import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import type { ListResponse } from "../models/common.js";
import { type PaymentLink, paymentLinkFromDict } from "../models/payment-link.js";
import {
  type PaymentLinkCreateParams,
  type PaymentLinkUpdateParams,
  serializePaymentLinkCreate,
  serializePaymentLinkUpdate,
} from "../params/payment-link.js";

export class PaymentLinkService extends BaseService {
  constructor(http: ZohoHttpClient) {
    super(http);
  }

  async create(params: PaymentLinkCreateParams): Promise<PaymentLink> {
    const body = serializePaymentLinkCreate(params);
    const res = await this._http.post("/paymentlinks", body);
    return this._unwrap(res.body, "payment_link", paymentLinkFromDict);
  }

  async get(paymentLinkId: string): Promise<PaymentLink> {
    const res = await this._http.get(`/paymentlinks/${encodeURIComponent(paymentLinkId)}`);
    return this._unwrap(res.body, "payment_link", paymentLinkFromDict);
  }

  async update(paymentLinkId: string, params: PaymentLinkUpdateParams): Promise<PaymentLink> {
    const body = serializePaymentLinkUpdate(params);
    const res = await this._http.put(`/paymentlinks/${encodeURIComponent(paymentLinkId)}`, body);
    return this._unwrap(res.body, "payment_link", paymentLinkFromDict);
  }

  async cancel(paymentLinkId: string): Promise<PaymentLink> {
    const res = await this._http.post(`/paymentlinks/${encodeURIComponent(paymentLinkId)}/cancel`, {});
    return this._unwrap(res.body, "payment_link", paymentLinkFromDict);
  }

  async list(params?: { page?: number; perPage?: number }): Promise<ListResponse<PaymentLink>> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params?.page !== undefined) query["page"] = params.page;
    if (params?.perPage !== undefined) query["per_page"] = params.perPage;
    const res = await this._http.get("/paymentlinks", query);
    return this._unwrapList(res.body, "payment_links", paymentLinkFromDict);
  }
}
