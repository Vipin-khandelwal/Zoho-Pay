import { BaseService } from "./BaseService.js";
import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import type { ListResponse } from "../models/common.js";
import { type Payment, paymentFromDict, type PaymentSummary, paymentSummaryFromDict } from "../models/payment.js";
import {
  type PaymentCreateParams,
  type PaymentListParams,
  serializePaymentCreate,
} from "../params/payment.js";
import { Edition, isUsEdition } from "../edition.js";
import { ZohoPaymentsException } from "../exceptions.js";

export class PaymentService extends BaseService {
  private readonly _edition: Edition;

  constructor(http: ZohoHttpClient, edition: Edition) {
    super(http);
    this._edition = edition;
  }

  /** Create a payment (US only). */
  async create(params: PaymentCreateParams): Promise<Payment> {
    if (!isUsEdition(this._edition)) {
      throw new ZohoPaymentsException("Payment creation is only available on Edition.US");
    }
    const body = serializePaymentCreate(params);
    const res = await this._http.post("/payments", body);
    return this._unwrap(res.body, "payment", paymentFromDict);
  }

  async get(paymentId: string): Promise<Payment> {
    const res = await this._http.get(`/payments/${encodeURIComponent(paymentId)}`);
    return this._unwrap(res.body, "payment", paymentFromDict);
  }

  async list(params?: PaymentListParams): Promise<ListResponse<PaymentSummary>> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params?.page !== undefined) query["page"] = params.page;
    if (params?.perPage !== undefined) query["per_page"] = params.perPage;
    if (params?.status !== undefined) query["status"] = params.status;
    if (params?.fromDate !== undefined) query["from_date"] = params.fromDate;
    if (params?.toDate !== undefined) query["to_date"] = params.toDate;
    const res = await this._http.get("/payments", query);
    return this._unwrapList(res.body, "payments", paymentSummaryFromDict);
  }

  /**
   * Verify a payment by ID — fetches the payment and returns it.
   * Use the returned `status` field to confirm the payment state.
   */
  async verify(paymentId: string): Promise<Payment> {
    return this.get(paymentId);
  }
}
