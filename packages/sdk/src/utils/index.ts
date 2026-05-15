// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Utilities
// ═══════════════════════════════════════════════════════════════════════════

import { v4 as uuid } from 'uuid';

/**
 * Generate a UUID v4.
 */
export function generateId(): string {
  return uuid();
}

/**
 * Sleep for N milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format ISO date to display date.
 */
export function formatDate(iso: string, locale = 'pt-BR'): string {
  return new Date(iso).toLocaleDateString(locale);
}

/**
 * Format currency value.
 */
export function formatCurrency(value: number, currency = 'BRL', locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/**
 * Truncate string to max length.
 */
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;
}

/**
 * Build URL with query parameters.
 */
export function buildUrl(base: string, params: Record<string, unknown>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Deep merge two objects.
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      ) as T[typeof key];
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[typeof key];
    }
  }
  return result;
}
