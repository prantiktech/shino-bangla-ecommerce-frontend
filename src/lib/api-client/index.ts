import { HttpClient } from './client';
import { authInterceptor } from './interceptors';
import { RequestConfig } from './types';

// Export all types and classes
export * from './types';
export { ApiError } from './error';
export { HttpClient } from './client';
export { logger } from './logger';
export { authInterceptor } from './interceptors';
export * from './status-handler';
export * from './endpoints';

// NOTE: Do NOT re-export './server' here — server.ts uses "use server".
// Import server functions directly: import { serverGet } from '@/lib/api-client/server'

const baseURL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://13.140.181.253/api/v1';

export const apiClient = new HttpClient({
  baseURL,
  headers: {
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(
  authInterceptor({
    tokenProvider: async (config?: RequestConfig) => {
      if (typeof window === 'undefined') {
        try {
          const { cookies, headers } = await import('next/headers');
          const cookieStore = await cookies();
          const reqHeaders = await headers();
          const referer = reqHeaders.get('referer') || '';

          const isAdminRequest =
            referer.includes('/admin') ||
            Boolean(
              config?.url &&
                (config.url.includes('/admin') ||
                  config.url.includes('ADMIN_') ||
                  config.url.includes('/staff') ||
                  config.url.includes('/roles') ||
                  config.url.includes('/permissions'))
            );

          if (isAdminRequest) {
            return (
              cookieStore.get('admin_token')?.value ||
              cookieStore.get('token')?.value ||
              cookieStore.get('customer_token')?.value
            );
          }
          return (
            cookieStore.get('customer_token')?.value ||
            cookieStore.get('token')?.value ||
            cookieStore.get('admin_token')?.value
          );
        } catch {
          return undefined;
        }
      } else {
        const isAdmin =
          window.location.pathname.startsWith('/admin') ||
          Boolean(
            config?.url &&
              (config.url.includes('/admin') ||
                config.url.includes('ADMIN_') ||
                config.url.includes('/staff') ||
                config.url.includes('/roles') ||
                config.url.includes('/permissions'))
          );
        const cookieName = isAdmin ? 'admin_client_token' : 'client-token';

        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${cookieName}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      }
    },
  })
);

apiClient.interceptors.response.use(
  (response: any) => response.data,
  (error: any) => Promise.reject(error)
);

export const apiRawClient = new HttpClient({
  baseURL,
  headers: {
    'Accept': 'application/json',
  },
});

apiRawClient.interceptors.request.use(authInterceptor());
