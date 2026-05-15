// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — API Client Abstract
// ═══════════════════════════════════════════════════════════════════════════

import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Generic HTTP client interface.
 * Implementations: AxiosHttpClient, FetchHttpClient, MockHttpClient
 */
export interface HttpClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>;
  post<T>(url: string, body?: unknown): Promise<ApiResponse<T>>;
  patch<T>(url: string, body?: unknown): Promise<ApiResponse<T>>;
  put<T>(url: string, body?: unknown): Promise<ApiResponse<T>>;
  delete<T>(url: string): Promise<ApiResponse<T>>;
}

/**
 * Client configuration.
 */
export interface ClientConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
  headers?: Record<string, string>;
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Authenticated API client — base class for all domain clients.
 */
export abstract class BaseApiClient {
  constructor(
    protected readonly http: HttpClient,
    protected readonly config: ClientConfig,
  ) {}

  protected getUrl(path: string): string {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const prefix = `/api/${this.config.apiVersion}`;
    return `${base}${prefix}${path}`;
  }

  protected async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const res = await this.http.get<T>(this.getUrl(path), params);
    return res.data;
  }

  protected async getPaginated<T>(
    path: string, params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<T>> {
    const res = await this.http.get<PaginatedResponse<T>>(this.getUrl(path), params);
    return res.data;
  }

  protected async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.http.post<T>(this.getUrl(path), body);
    return res.data;
  }

  protected async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.http.patch<T>(this.getUrl(path), body);
    return res.data;
  }

  protected async delete<T>(path: string): Promise<T> {
    const res = await this.http.delete<T>(this.getUrl(path));
    return res.data;
  }
}
