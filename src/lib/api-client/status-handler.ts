import { ApiError } from './error';

export interface HandledError {
  message: string;
  code: string;
  status?: number;
  fields?: Record<string, string[]>;
  details?: any;
}

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: HandledError };

export function extractBackendErrorDetails(data: any): {
  message?: string;
  fields?: Record<string, string[]>;
  extractedMessages: string[];
} {
  const extractedMessages: string[] = [];
  const fields: Record<string, string[]> = {};

  if (!data || typeof data !== 'object') {
    return { extractedMessages };
  }

  const rawErrors = data.errors || data.validationErrors || data.fields;

  if (rawErrors) {
    if (Array.isArray(rawErrors)) {
      rawErrors.forEach((item) => {
        if (typeof item === 'string') {
          if (!extractedMessages.includes(item)) extractedMessages.push(item);
        } else if (item && typeof item === 'object') {
          const fieldName = item.field || item.propertyName || item.key || item.path;
          const msg = item.message || item.errorMessage || item.error;
          if (msg && typeof msg === 'string') {
            if (!extractedMessages.includes(msg)) extractedMessages.push(msg);
            if (fieldName && typeof fieldName === 'string') {
              const k = fieldName;
              if (!fields[k]) fields[k] = [];
              fields[k].push(msg);
            }
          }
        }
      });
    } else if (typeof rawErrors === 'object') {
      for (const [key, val] of Object.entries(rawErrors)) {
        const msgs: string[] = Array.isArray(val)
          ? val.map((v) => (typeof v === 'string' ? v : String(v)))
          : typeof val === 'string'
          ? [val]
          : [];

        if (msgs.length > 0) {
          fields[key] = msgs;
          msgs.forEach((m) => {
            if (m && !extractedMessages.includes(m)) {
              extractedMessages.push(m);
            }
          });
        }
      }
    }
  }

  const rawMessage = typeof data.message === 'string' ? data.message : undefined;

  return {
    message: rawMessage,
    fields: Object.keys(fields).length > 0 ? fields : undefined,
    extractedMessages,
  };
}

export function handleStatusCode(status: number, data: any): HandledError {
  let message = 'An unexpected error occurred.';
  let code = 'UNKNOWN_ERROR';

  const { message: backendMessage, fields, extractedMessages } = extractBackendErrorDetails(data);

  switch (status) {
    case 400:
      code = 'BAD_REQUEST';
      message = backendMessage || 'Bad Request. Please check your input parameters.';
      break;
    case 401:
      code = 'UNAUTHORIZED';
      message = backendMessage || 'Unauthorized. Please log in.';
      break;
    case 403:
      code = 'FORBIDDEN';
      message = backendMessage || 'Forbidden. You do not have permission to access this resource.';
      break;
    case 404:
      code = 'NOT_FOUND';
      message = backendMessage || 'Resource not found.';
      break;
    case 408:
      code = 'TIMEOUT';
      message = backendMessage || 'Request Timeout. The server took too long to respond.';
      break;
    case 409:
      code = 'CONFLICT';
      message = backendMessage || 'Conflict occurred with an existing resource.';
      break;
    case 422:
      code = 'VALIDATION_FAILED';
      message = backendMessage || 'Validation failed. Please check the entered data.';
      break;
    case 429:
      code = 'TOO_MANY_REQUESTS';
      message = backendMessage || 'Too many requests. Please slow down and try again.';
      break;
    case 500:
      code = 'INTERNAL_SERVER_ERROR';
      message = backendMessage || 'Internal Server Error. Please try again later.';
      break;
    case 502:
      code = 'BAD_GATEWAY';
      message = backendMessage || 'Bad Gateway. The upstream server is down.';
      break;
    case 503:
      code = 'SERVICE_UNAVAILABLE';
      message = backendMessage || 'Service Unavailable. The server is temporarily overloaded.';
      break;
    case 504:
      code = 'GATEWAY_TIMEOUT';
      message = backendMessage || 'Gateway Timeout.';
      break;
    default:
      if (status >= 500) {
        code = 'SERVER_ERROR';
        message = backendMessage || 'Server error. Please try again later.';
      } else if (status >= 400) {
        code = 'CLIENT_ERROR';
        message = backendMessage || 'Client error.';
      }
  }

  if (extractedMessages.length > 0) {
    const combinedExtracted = extractedMessages.join(' ');
    if (!message || message === 'An unexpected error occurred.') {
      message = combinedExtracted;
    } else if (!message.includes(combinedExtracted)) {
      message = `${message} ${combinedExtracted}`;
    }
  }

  return { message, code, status, fields, details: data };
}

export function handleActionError(error: any): { success: false; error: HandledError } {
  if (ApiError.isApiError(error)) {
    if (error.isTimeout) {
      return {
        success: false,
        error: {
          message: 'The request timed out. Please check your connection and try again.',
          code: 'TIMEOUT',
          status: 408,
        },
      };
    }
    if (error.isNetworkError) {
      return {
        success: false,
        error: {
          message: 'Network connection error. Please verify the API server is reachable.',
          code: 'NETWORK_ERROR',
        },
      };
    }

    const status = error.status || 500;
    const handled = handleStatusCode(status, error.data);
    return { success: false, error: handled };
  }

  return {
    success: false,
    error: {
      message: error instanceof Error ? error.message : 'An unknown error occurred.',
      code: 'UNKNOWN',
    },
  };
}
