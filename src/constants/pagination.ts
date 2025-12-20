/**
 * Pagination constants for consistent pagination across the application
 */

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 1000;
export const MIN_PAGE_SIZE = 1;
export const DEFAULT_SKIP = 0;

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(skip: number, limit: number): void {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error(`Invalid skip parameter: ${skip}. Must be a non-negative integer.`);
  }
  
  if (!Number.isInteger(limit) || limit < MIN_PAGE_SIZE || limit > MAX_PAGE_SIZE) {
    throw new Error(
      `Invalid limit parameter: ${limit}. Must be between ${MIN_PAGE_SIZE} and ${MAX_PAGE_SIZE}.`
    );
  }
}

