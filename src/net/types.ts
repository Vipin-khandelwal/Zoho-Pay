export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ZohoRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string | undefined;
  timeoutMs: number | undefined;
}

export interface ZohoResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Pluggable HTTP transport interface.
 * Implement this to inject custom retry logic, proxies, or instrumentation.
 */
export interface HttpTransport {
  execute(request: ZohoRequest): Promise<ZohoResponse>;
  close?(): void | Promise<void>;
}
