/**
 * Exception hierarchy for the Zoho Payments SDK.
 *
 * ZohoPaymentsException             — base SDK exception
 *   ConnectionException             — network / IO failure
 *   ZohoPaymentsAPIException        — base for HTTP non-2xx responses
 *     AuthenticationException       — 401
 *     PermissionException           — 403
 *     ResourceNotFoundException     — 404
 *     InvalidRequestException       — 400 / 422
 *     RateLimitException            — 429
 */

export class ZohoPaymentsException extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ZohoPaymentsException";
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConnectionException extends ZohoPaymentsException {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ConnectionException";
  }
}

export class ZohoPaymentsAPIException extends ZohoPaymentsException {
  readonly httpStatusCode: number;
  readonly codeString: string | undefined;
  readonly apiErrorMessage: string | undefined;
  readonly rawBody: string;

  constructor(params: {
    message: string;
    httpStatusCode: number;
    codeString?: string;
    apiErrorMessage?: string;
    rawBody?: string;
  }) {
    super(params.message);
    this.name = "ZohoPaymentsAPIException";
    this.httpStatusCode = params.httpStatusCode;
    this.codeString = params.codeString;
    this.apiErrorMessage = params.apiErrorMessage;
    this.rawBody = params.rawBody ?? "";
  }
}

export class AuthenticationException extends ZohoPaymentsAPIException {
  constructor(params: Omit<ConstructorParameters<typeof ZohoPaymentsAPIException>[0], "httpStatusCode">) {
    super({ ...params, httpStatusCode: 401 });
    this.name = "AuthenticationException";
  }
}

export class PermissionException extends ZohoPaymentsAPIException {
  constructor(params: Omit<ConstructorParameters<typeof ZohoPaymentsAPIException>[0], "httpStatusCode">) {
    super({ ...params, httpStatusCode: 403 });
    this.name = "PermissionException";
  }
}

export class ResourceNotFoundException extends ZohoPaymentsAPIException {
  constructor(params: Omit<ConstructorParameters<typeof ZohoPaymentsAPIException>[0], "httpStatusCode">) {
    super({ ...params, httpStatusCode: 404 });
    this.name = "ResourceNotFoundException";
  }
}

export class InvalidRequestException extends ZohoPaymentsAPIException {
  constructor(params: Omit<ConstructorParameters<typeof ZohoPaymentsAPIException>[0], "httpStatusCode"> & { httpStatusCode?: number }) {
    super({ ...params, httpStatusCode: params.httpStatusCode ?? 400 });
    this.name = "InvalidRequestException";
  }
}

export class RateLimitException extends ZohoPaymentsAPIException {
  constructor(params: Omit<ConstructorParameters<typeof ZohoPaymentsAPIException>[0], "httpStatusCode">) {
    super({ ...params, httpStatusCode: 429 });
    this.name = "RateLimitException";
  }
}
