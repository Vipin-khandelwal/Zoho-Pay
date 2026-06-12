import {
  requireField,
  validateMetaData,
  serializeMetaData,
  type MetaDataParams,
  type PaginationParams,
} from "./common.js";

export interface CustomerCreateParams {
  name: string;
  email?: string;
  phone?: string;
  dialingCode?: string;
  metaData?: MetaDataParams[];
}

export interface CustomerListParams extends PaginationParams {
  email?: string;
}

export function serializeCustomerCreate(p: CustomerCreateParams): Record<string, unknown> {
  requireField(p.name, "name");
  validateMetaData(p.metaData);

  const body: Record<string, unknown> = { name: p.name };
  if (p.email !== undefined) body["email"] = p.email;
  if (p.phone !== undefined) body["phone"] = p.phone;
  if (p.dialingCode !== undefined) body["dialing_code"] = p.dialingCode;
  if (p.metaData !== undefined) body["meta_data"] = serializeMetaData(p.metaData);
  return body;
}
