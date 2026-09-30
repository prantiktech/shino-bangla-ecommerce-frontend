import { RequestConfig } from './types';

export class ApiError<T = any> extends Error {
  public status?: number;
  public statusText?: string;
  public data?: T;
  public headers?: Headers;
  public config: RequestConfig;
  public isNetworkError: boolean;
  public isTimeout: boolean;

  constructor({
    message,
    status,
    statusText,
    data,
    headers,
    config,
    isNetworkError = false,
    isTimeout = false,
  }: {
    message: string;
    status?: number;
    statusText?: string;
    data?: T;
    headers?: Headers;
    config: RequestConfig;
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.headers = headers;
    this.config = config;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;

    Object.setPrototypeOf(this, ApiError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  public static isApiError(error: any): error is ApiError {
    return error instanceof ApiError || (error && error.name === 'ApiError');
  }
}
