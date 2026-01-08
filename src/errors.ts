/**
 * Custom error classes for SoundTouch API
 */

export class ConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "ConnectionError";
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export interface ApiErrorResponse {
  error: {
    name: string;
    code: number;
    message?: string;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly errorName: string,
    public readonly errorCode: number,
    message?: string
  ) {
    super(message || `API error: ${errorName} (code ${errorCode})`);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
