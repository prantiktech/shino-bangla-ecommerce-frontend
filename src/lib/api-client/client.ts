import {
  RequestConfig,
  ApiResponse,
  HttpMethod,
  RequestInterceptor,
  ResponseInterceptor,
  InterceptorManager,
} from './types';
import { ApiError } from './error';
import { logger } from './logger';
import { resolveEndpoint, TargetEndpoint } from './endpoints';

class InterceptorHandler<T> implements InterceptorManager<T> {
  private handlers: Array<T | null> = [];

  public use(onFulfilled?: any, onRejected?: any): number {
    this.handlers.push({ onFulfilled, onRejected } as any);
    return this.handlers.length - 1;
  }

  public eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  public forEach(fn: (handler: T) => void): void {
    this.handlers.forEach((h) => {
      if (h !== null) fn(h);
    });
  }
}

export class HttpClient {
  public defaults: RequestConfig;
  public interceptors = {
    request: new InterceptorHandler<RequestInterceptor>(),
    response: new InterceptorHandler<ResponseInterceptor>(),
  };

  constructor(defaultConfig: RequestConfig = {}) {
    this.defaults = {
      timeout: 15000,
      retries: 1,
      retryDelay: 1000,
      responseType: 'json',
      ...defaultConfig,
    };
  }

  public async request<T = any, R = ApiResponse<T>>(
    endpoint: TargetEndpoint,
    config: RequestConfig = {}
  ): Promise<R> {
    const resolvedPath = resolveEndpoint(endpoint, config.pathParams);

    let mergedConfig: RequestConfig = {
      ...this.defaults,
      ...config,
      url: resolvedPath,
      headers: {
        ...this.defaults.headers,
        ...config.headers,
      },
    };

    // Execute Request Interceptors (LIFO)
    const requestChain: RequestInterceptor[] = [];
    this.interceptors.request.forEach((interceptor) => {
      requestChain.unshift(interceptor);
    });

    for (const interceptor of requestChain) {
      if (interceptor.onFulfilled) {
        try {
          mergedConfig = await interceptor.onFulfilled(mergedConfig);
        } catch (err) {
          if (interceptor.onRejected) {
            return interceptor.onRejected(err);
          }
          throw err;
        }
      }
    }

    // Execute Request with Retries
    let responsePromise: Promise<ApiResponse<T>> = this.requestWithRetry(mergedConfig);

    // Execute Response Interceptors (FIFO)
    const responseChain: ResponseInterceptor[] = [];
    this.interceptors.response.forEach((interceptor) => {
      responseChain.push(interceptor);
    });

    for (const interceptor of responseChain) {
      responsePromise = responsePromise.then(
        (res) => (interceptor.onFulfilled ? interceptor.onFulfilled(res) : res),
        (err) => (interceptor.onRejected ? interceptor.onRejected(err) : Promise.reject(err))
      );
    }

    return responsePromise as unknown as Promise<R>;
  }

  public get<T = any, R = ApiResponse<T>>(url: TargetEndpoint, config?: RequestConfig): Promise<R> {
    return this.request<T, R>(url, { ...config, method: 'GET' });
  }

  public post<T = any, R = ApiResponse<T>>(url: TargetEndpoint, body?: any, config?: RequestConfig): Promise<R> {
    return this.request<T, R>(url, { ...config, method: 'POST', body });
  }

  public put<T = any, R = ApiResponse<T>>(url: TargetEndpoint, body?: any, config?: RequestConfig): Promise<R> {
    return this.request<T, R>(url, { ...config, method: 'PUT', body });
  }

  public patch<T = any, R = ApiResponse<T>>(url: TargetEndpoint, body?: any, config?: RequestConfig): Promise<R> {
    return this.request<T, R>(url, { ...config, method: 'PATCH', body });
  }

  public delete<T = any, R = ApiResponse<T>>(url: TargetEndpoint, config?: RequestConfig): Promise<R> {
    return this.request<T, R>(url, { ...config, method: 'DELETE' });
  }

  private async requestWithRetry(config: RequestConfig): Promise<ApiResponse> {
    let attempt = 0;
    const maxRetries = config.retries ?? 0;
    const delay = config.retryDelay ?? 1000;

    while (true) {
      try {
        return await this.dispatchRequest(config);
      } catch (error: any) {
        attempt++;
        const isRetriable =
          ApiError.isApiError(error) &&
          (error.isNetworkError || error.isTimeout || (error.status && error.status >= 500));

        if (attempt <= maxRetries && isRetriable) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[API Client] Request to ${config.url} failed. Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`
            );
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }

  private async dispatchRequest(config: RequestConfig): Promise<ApiResponse> {
    const {
      baseURL = '',
      url = '',
      method = 'GET',
      params,
      body,
      timeout = 15000,
      headers,
      responseType = 'json',
      validateStatus = (status) => status >= 200 && status < 300,
      cache,
      next,
      ...extraOptions
    } = config;

    const fullUrl = this.buildUrl(baseURL, url, params);
    const finalHeaders = this.mergeHeaders(headers);

    const fetchOptions: RequestInit = {
      method,
      headers: finalHeaders,
      ...extraOptions,
    };

    if (cache) fetchOptions.cache = cache;
    if (next) (fetchOptions as any).next = next;

    if (body !== undefined && body !== null) {
      if (this.isPlainObject(body)) {
        fetchOptions.body = JSON.stringify(body);
        if (!finalHeaders.has('Content-Type')) {
          finalHeaders.set('Content-Type', 'application/json');
        }
      } else {
        fetchOptions.body = body;
        if (typeof FormData !== 'undefined' && body instanceof FormData) {
          finalHeaders.delete('Content-Type');
          finalHeaders.delete('content-type');
        }
      }
    }

    let timeoutId: NodeJS.Timeout | undefined;
    if (timeout > 0) {
      const controller = new AbortController();
      fetchOptions.signal = controller.signal;

      if (config.signal) {
        config.signal.addEventListener('abort', () => controller.abort());
      }

      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
    }

    const startTime = Date.now();
    logger.request(config);

    let response: Response;
    try {
      response = await fetch(fullUrl, fetchOptions);
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' && timeout > 0 && !config.signal?.aborted;
      const apiErr = new ApiError({
        message: isTimeout ? `Request timed out after ${timeout}ms` : err.message || 'Network error',
        config,
        isNetworkError: !isTimeout,
        isTimeout,
      });
      logger.error(apiErr, Date.now() - startTime);
      throw apiErr;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    const duration = Date.now() - startTime;

    let responseData: any;
    try {
      if (responseType === 'json') {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : null;
      } else if (responseType === 'text') {
        responseData = await response.text();
      } else if (responseType === 'blob') {
        responseData = await response.blob();
      } else if (responseType === 'arrayBuffer') {
        responseData = await response.arrayBuffer();
      } else if (responseType === 'formData') {
        responseData = await response.formData();
      }
    } catch (parseErr: any) {
      const apiErr = new ApiError({
        message: `Failed to parse response body as ${responseType}: ${parseErr.message}`,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
      });
      logger.error(apiErr, duration);
      throw apiErr;
    }

    const apiResponse: ApiResponse = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
    };

    if (!validateStatus(response.status)) {
      const apiErr = new ApiError({
        message: responseData?.message || `Request failed with status code ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: response.headers,
        config,
      });
      logger.error(apiErr, duration);
      throw apiErr;
    }

    logger.response(apiResponse, duration);
    return apiResponse;
  }

  private buildUrl(baseURL: string, url: string, params?: Record<string, any>): string {
    let cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    let cleanUrl = url.startsWith('/') ? url : `/${url}`;

    let mergedUrl = /^https?:\/\//i.test(url) ? url : `${cleanBase}${cleanUrl}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((val) => {
            if (val !== undefined && val !== null) {
              searchParams.append(key, String(val));
            }
          });
        } else {
          searchParams.append(key, String(value));
        }
      });
      const queryStr = searchParams.toString();
      if (queryStr) {
        mergedUrl += (mergedUrl.includes('?') ? '&' : '?') + queryStr;
      }
    }

    return mergedUrl;
  }

  private mergeHeaders(...headersList: Array<HeadersInit | undefined>): Headers {
    const merged = new Headers();
    headersList.forEach((headers) => {
      if (!headers) return;
      if (headers instanceof Headers) {
        headers.forEach((value, key) => merged.set(key, value));
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => merged.set(key, value));
      } else {
        Object.entries(headers).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            merged.set(key, String(value));
          }
        });
      }
    });
    return merged;
  }

  private isPlainObject(val: any): boolean {
    if (val === null || typeof val !== 'object') return false;
    const prototype = Object.getPrototypeOf(val);
    return prototype === null || prototype === Object.prototype;
  }
}
