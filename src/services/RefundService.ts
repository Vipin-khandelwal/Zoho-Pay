import { BaseService } from "./BaseService.js";
import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import type { ListResponse } from "../models/common.js";
import { type Refund, refundFromDict } from "../models/refund.js";
import { type RefundCreateParams, serializeRefundCreate } from "../params/refund.js";

export class RefundService extends BaseService {
  constructor(http: ZohoHttpClient) {
    super(http);
  }

  async create(paymentId: string, params: RefundCreateParams): Promise<Refund> {
    const body = serializeRefundCreate(params);
    const res = await this._http.post(`/payments/${encodeURIComponent(paymentId)}/refunds`, body);
    return this._unwrap(res.body, "refund", refundFromDict);
  }

  async get(refundId: string): Promise<Refund> {
    const res = await this._http.get(`/refunds/${encodeURIComponent(refundId)}`);
    return this._unwrap(res.body, "refund", refundFromDict);
  }

  async list(params?: { page?: number; perPage?: number }): Promise<ListResponse<Refund>> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params?.page !== undefined) query["page"] = params.page;
    if (params?.perPage !== undefined) query["per_page"] = params.perPage;
    const res = await this._http.get("/refunds", query);
    return this._unwrapList(res.body, "refunds", refundFromDict);
  }
}
