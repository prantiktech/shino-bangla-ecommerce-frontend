import { RequestConfig, ApiResponse } from './types';
import { ApiError } from './error';

export interface AuthInterceptorOptions {
  tokenName?: string;
  adminTokenName?: string;
  tokenProvider?: () => Promise<string | null | undefined> | string | null | undefined;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Request Interceptor: Automatically injects JWT Bearer token and X-Cart-Token
 */
export function authInterceptor(options: AuthInterceptorOptions = {}) {
  const tokenName = options.tokenName || 'token';
  const adminTokenName = options.adminTokenName || 'admin_token';

  return async (config: RequestConfig): Promise<RequestConfig> => {
    const headers = new Headers(config.headers);

    let token: string | null | undefined = null;

    if (options.tokenProvider) {
      token = await options.tokenProvider();
    } else {
      if (typeof window === 'undefined') {
        try {
          const { cookies, headers: getReqHeaders } = await import('next/headers');
          const cookieStore = await cookies();
          const reqHeaders = await getReqHeaders();
          const referer = reqHeaders.get('referer') || '';

          if (referer.includes('/admin') || config.url?.includes('/admin')) {
            token = cookieStore.get(adminTokenName)?.value;
          }
          if (!token) {
            token = cookieStore.get(tokenName)?.value;
          }
        } catch {
          // Outside of request context
        }
      } else {
        const isAdmin = window.location.pathname.startsWith('/admin') || config.url?.includes('/admin');
        if (isAdmin) {
          token = getCookie('admin_client_token') || localStorage.getItem('admin_token');
        }
        if (!token) {
          token = getCookie('client-token') || localStorage.getItem('token');
        }
      }
    }

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Guest Cart Token support (X-Cart-Token)
    if (!token && !headers.has('X-Cart-Token')) {
      let cartToken: string | undefined = undefined;
      if (typeof window === 'undefined') {
        try {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          cartToken = cookieStore.get('cart_token')?.value;
        } catch {
          // ignore
        }
      } else {
        cartToken = localStorage.getItem('cart_token') || getCookie('cart_token');
      }

      if (cartToken) {
        headers.set('X-Cart-Token', cartToken);
      }
    }

    config.headers = headers;
    return config;
  };
}
