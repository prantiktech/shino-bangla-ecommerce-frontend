import { RequestConfig, ApiResponse } from './types';
import { ApiError } from './error';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  request(config: RequestConfig) {
    if (!isDev) return;
    const method = config.method || 'GET';
    const url = config.url || '';
    if (typeof window === 'undefined') {
      console.log(`\x1b[36m[API Request]\x1b[0m \x1b[33m${method}\x1b[0m ${url}`);
    } else {
      console.groupCollapsed(`%c[API Request] %c${method} %c${url}`, 'color: #0ea5e9; font-weight: bold;', 'color: #f59e0b; font-weight: bold;', 'color: gray;');
      console.log('Config:', config);
      console.groupEnd();
    }
  },

  response(response: ApiResponse, duration: number) {
    if (!isDev) return;
    const method = response.config.method || 'GET';
    const url = response.config.url || '';
    const status = response.status;
    if (typeof window === 'undefined') {
      console.log(`\x1b[32m[API Response]\x1b[0m \x1b[33m${method}\x1b[0m ${url} - \x1b[32m${status}\x1b[0m (${duration}ms)`);
    } else {
      console.groupCollapsed(`%c[API Response] %c${method} %c${url} %c${status} (%c${duration}ms)`, 'color: #10b981; font-weight: bold;', 'color: #f59e0b; font-weight: bold;', 'color: gray;', 'color: #10b981; font-weight: bold;', 'color: #6b7280;');
      console.log('Data:', response.data);
      console.groupEnd();
    }
  },

  error(error: ApiError, duration?: number) {
    if (!isDev) return;
    const method = error.config?.method || 'UNKNOWN';
    const url = error.config?.url || '';
    const status = error.status || 'ERR';
    if (typeof window === 'undefined') {
      console.error(`\x1b[31m[API Error]\x1b[0m \x1b[33m${method}\x1b[0m ${url} - \x1b[31m${status}\x1b[0m: ${error.message}${duration ? ` (${duration}ms)` : ''}`);
    } else {
      console.groupCollapsed(`%c[API Error] %c${method} %c${url} %c${status}`, 'color: #ef4444; font-weight: bold;', 'color: #f59e0b; font-weight: bold;', 'color: gray;', 'color: #ef4444; font-weight: bold;');
      console.error('Message:', error.message);
      console.error('Data:', error.data);
      console.groupEnd();
    }
  },
};
