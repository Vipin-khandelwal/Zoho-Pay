import type { HttpTransport, ZohoRequest, ZohoResponse } from "./types.js";
import { ConnectionException } from "../exceptions.js";
import { DEFAULT_CONNECT_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS } from "../constants.js";

export interface DefaultHttpTransportOptions {
  connectTimeoutMs?: number;
  requestTimeoutMs?: number;
}

/**
 * Default HTTP transport using the global `fetch` API (Node 18+, browsers).
 * Replace with a custom HttpTransport for retries, proxies, or instrumentation.
 */
export class DefaultHttpTransport implements HttpTransport {
  private readonly _requestTimeoutMs: number;

  constructor(options: DefaultHttpTransportOptions = {}) {
    this._requestTimeoutMs =
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  async execute(request: ZohoRequest): Promise<ZohoResponse> {
    const timeoutMs = request.timeoutMs ?? this._requestTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      const fetchInit: RequestInit = {
        method: request.method,
        headers: request.headers,
        signal: controller.signal,
      };
      if (request.body !== undefined) {
        fetchInit.body = request.body;
      }
      response = await fetch(request.url, fetchInit);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new ConnectionException(
          `Request timed out after ${timeoutMs}ms: ${request.url}`
        );
      }
      throw new ConnectionException(
        `Network error: ${String(err)}`,
        { cause: err }
      );
    } finally {
      clearTimeout(timer);
    }

    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { statusCode: response.status, headers, body };
  }

  close(): void {
    // fetch-based transport has no persistent connections to close
  }
}
