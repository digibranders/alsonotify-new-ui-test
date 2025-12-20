/**
 * Validation utilities for type checking and data validation
 */

/**
 * Type guard to check if value is a valid number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard to check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if value is a valid array
 */
export function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }
  
  if (itemGuard) {
    return value.every(itemGuard);
  }
  
  return true;
}

/**
 * Validate and sanitize a hex color string
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Normalize hex color to 6-digit format
 */
export function normalizeHexColor(hex: string): string {
  if (!hex.startsWith('#')) {
    hex = '#' + hex;
  }
  
  // Remove # if present
  let cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  return '#' + cleanHex;
}

