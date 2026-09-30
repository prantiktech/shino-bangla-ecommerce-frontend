"use server";

import { apiClient } from './index';
import { RequestConfig } from './types';
import { TargetEndpoint } from './endpoints';
import { handleActionError, ActionResponse } from './status-handler';

/**
 * Reusable Server Action for GET requests.
 * Runs on the server side, handles authentication via server cookies, and parses responses/errors.
 */
export async function serverGet<T = any>(
  url: TargetEndpoint,
  config?: RequestConfig
): Promise<ActionResponse<T>> {
  try {
    const data = await apiClient.get<T, T>(url, config);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Reusable Server Action for POST requests.
 * Runs on the server side, handles authentication via server cookies, and parses responses/errors.
 */
export async function serverPost<T = any>(
  url: TargetEndpoint,
  body?: any,
  config?: RequestConfig
): Promise<ActionResponse<T>> {
  try {
    const data = await apiClient.post<T, T>(url, body, config);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Reusable Server Action for PUT requests.
 * Runs on the server side, handles authentication via server cookies, and parses responses/errors.
 */
export async function serverPut<T = any>(
  url: TargetEndpoint,
  body?: any,
  config?: RequestConfig
): Promise<ActionResponse<T>> {
  try {
    const data = await apiClient.put<T, T>(url, body, config);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Reusable Server Action for PATCH requests.
 * Runs on the server side, handles authentication via server cookies, and parses responses/errors.
 */
export async function serverPatch<T = any>(
  url: TargetEndpoint,
  body?: any,
  config?: RequestConfig
): Promise<ActionResponse<T>> {
  try {
    const data = await apiClient.patch<T, T>(url, body, config);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Reusable Server Action for DELETE requests.
 * Runs on the server side, handles authentication via server cookies, and parses responses/errors.
 */
export async function serverDelete<T = any>(
  url: TargetEndpoint,
  config?: RequestConfig
): Promise<ActionResponse<T>> {
  try {
    const data = await apiClient.delete<T, T>(url, config);
    return { success: true, data };
  } catch (error) {
    return handleActionError(error);
  }
}
