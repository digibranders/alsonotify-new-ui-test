/**
 * Time formatting utilities
 * Extracted from ProductivityWidget for shared use
 */

/**
 * Format seconds as HH:MM:SS
 * @param seconds - Total seconds to format
 * @returns Formatted time string (e.g., "01:23:45")
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Alias for formatDuration - formats seconds as HH:MM:SS
 * @param seconds - Total seconds to format
 * @returns Formatted time string (e.g., "01:23:45")
 */
export const formatTime = formatDuration;

/**
 * Parse date string as UTC
 * 
 * Backend stores dates in UTC but may return without 'Z' suffix.
 * JavaScript's `new Date()` interprets dates without 'Z' as local time,
 * causing timezone offset issues.
 * 
 * @param dateString - ISO date string to parse
 * @returns Date object interpreted as UTC
 */
export function parseAsUTC(dateString: string): Date {
  if (!dateString) return new Date();
  // If already has timezone info (Z or +/-offset), parse directly
  if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  // Otherwise, append 'Z' to treat as UTC
  return new Date(dateString + 'Z');
}
