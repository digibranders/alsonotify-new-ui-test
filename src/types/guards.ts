/**
 * Type guards and utility functions for safe object property access
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getString(obj: Record<string, unknown>, key: string): string | undefined {
  const val = obj[key];
  return typeof val === 'string' ? val : undefined;
}

export function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const val = obj[key];
  return typeof val === 'number' ? val : undefined;
}

export function getArray(obj: Record<string, unknown>, key: string): unknown[] | undefined {
  const val = obj[key];
  return Array.isArray(val) ? val : undefined;
}

export function getBoolean(obj: Record<string, unknown>, key: string): boolean | undefined {
  const val = obj[key];
  return typeof val === 'boolean' ? val : undefined;
}
