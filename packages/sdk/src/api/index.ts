// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/sdk — Typed HTTP Helpers
// ═══════════════════════════════════════════════════════════════════════════

import { PaginatedResponse, ApiError } from '../types';

/**
 * Parse HTTP response.
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
      code: 'HTTP_ERROR',
    }));
    throw error;
  }
  return response.json();
}

/**
 * Parse paginated response.
 */
export async function parsePaginated<T>(response: Response): Promise<PaginatedResponse<T>> {
  return parseResponse<PaginatedResponse<T>>(response);
}

/**
 * Build fetch request with defaults.
 */
export function buildRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    tenantId?: string;
    headers?: Record<string, string>;
  } = {},
): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  if (options.tenantId) headers['X-Tenant-Id'] = options.tenantId;

  const request: RequestInit = { method: options.method ?? 'GET', headers };

  if (options.body) {
    request.body = JSON.stringify(options.body);
  }

  return request;
}

/**
 * Typed HTTP helper functions (usado por qualquer runtime: browser, node, worker).
 */

export async function apiGet<T>(
  baseUrl: string, path: string, options?: { token?: string; tenantId?: string },
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, buildRequest(path, { method: 'GET', ...options }));
  return parseResponse<T>(res);
}

export async function apiPost<T>(
  baseUrl: string, path: string, body?: unknown,
  options?: { token?: string; tenantId?: string },
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, buildRequest(path, { method: 'POST', body, ...options }));
  return parseResponse<T>(res);
}

export async function apiPatch<T>(
  baseUrl: string, path: string, body?: unknown,
  options?: { token?: string; tenantId?: string },
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, buildRequest(path, { method: 'PATCH', body, ...options }));
  return parseResponse<T>(res);
}

export async function apiDelete<T>(
  baseUrl: string, path: string, options?: { token?: string; tenantId?: string },
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, buildRequest(path, { method: 'DELETE', ...options }));
  return parseResponse<T>(res);
}
