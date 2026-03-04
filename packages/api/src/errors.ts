import { SoundTouchError } from "@soundtouch/core";

export class ConnectionError extends SoundTouchError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConnectionError";
  }
}

export class TimeoutError extends SoundTouchError {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class ApiError extends SoundTouchError {
  constructor(
    public readonly errorName: string,
    public readonly errorCode: number,
    message?: string,
  ) {
    super(message || `API error: ${errorName} (code ${errorCode})`);
    this.name = "ApiError";
  }
}
