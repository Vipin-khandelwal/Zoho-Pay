import { BaseService } from "./BaseService.js";
import type { ZohoHttpClient } from "../net/ZohoHttpClient.js";
import type { ListResponse } from "../models/common.js";
import { type Customer, customerFromDict, type CustomerSummary, customerSummaryFromDict } from "../models/customer.js";
import {
  type CustomerCreateParams,
  type CustomerListParams,
  serializeCustomerCreate,
} from "../params/customer.js";
import { Edition, isUsEdition } from "../edition.js";
import { ZohoPaymentsException } from "../exceptions.js";

export class CustomerService extends BaseService {
  private readonly _edition: Edition;

  constructor(http: ZohoHttpClient, edition: Edition) {
    super(http);
    this._edition = edition;
  }

  async create(params: CustomerCreateParams): Promise<Customer> {
    const body = serializeCustomerCreate(params);
    const res = await this._http.post("/customers", body);
    return this._unwrap(res.body, "customer", customerFromDict);
  }

  async get(customerId: string): Promise<Customer> {
    const res = await this._http.get(`/customers/${encodeURIComponent(customerId)}`);
    return this._unwrap(res.body, "customer", customerFromDict);
  }

  /** List customers (US only). */
  async list(params?: CustomerListParams): Promise<ListResponse<CustomerSummary>> {
    if (!isUsEdition(this._edition)) {
      throw new ZohoPaymentsException("Customer listing is only available on Edition.US");
    }
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params?.page !== undefined) query["page"] = params.page;
    if (params?.perPage !== undefined) query["per_page"] = params.perPage;
    if (params?.email !== undefined) query["email"] = params.email;
    const res = await this._http.get("/customers", query);
    return this._unwrapList(res.body, "customers", customerSummaryFromDict);
  }

  /** Delete a customer (US only). */
  async delete(customerId: string): Promise<void> {
    if (!isUsEdition(this._edition)) {
      throw new ZohoPaymentsException("Customer deletion is only available on Edition.US");
    }
    await this._http.delete(`/customers/${encodeURIComponent(customerId)}`);
  }
}
