export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RequestConfig extends Omit<RequestInit, 'body' | 'method'> {
  url?: string;
  method?: HttpMethod;
  baseURL?: string;
  params?: Record<string, string | number | boolean | undefined | null | string[]>;
  pathParams?: Record<string, string | number>;
  body?: any;
  timeout?: number; // In milliseconds
  retries?: number; // Number of retries
  retryDelay?: number; // In milliseconds
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
  validateStatus?: (status: number) => boolean;
  skipAuth?: boolean;

  // Next.js specific fetch features
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}

export interface RequestInterceptor {
  onFulfilled?: (value: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRejected?: (error: any) => any;
}

export interface ResponseInterceptor {
  onFulfilled?: (value: ApiResponse) => any | Promise<any>;
  onRejected?: (error: any) => any;
}

export interface InterceptorManager<T> {
  use(onFulfilled?: (value: T) => any | Promise<any>, onRejected?: (error: any) => any): number;
  eject(id: number): void;
}
