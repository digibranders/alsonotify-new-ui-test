const DEFAULT_REDIRECT = '/dashboard';

// C0 and C1 control characters. A newline here could split a header or smuggle
// a second directive into a URL.
// eslint-disable-next-line no-control-regex -- deliberate: matching control chars is the point
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/;

/**
 * Reduce an untrusted `?redirect=` value to a safe same-origin path.
 *
 * Anything that could leave this origin returns the fallback. We ALLOWLIST the
 * shape we want — exactly one leading slash followed by a character that is
 * neither a slash nor a backslash — rather than blocklisting known-bad
 * prefixes. Blocklists lose to encoding tricks; this shape check rejects
 * "//evil.com", "/\evil.com", "\\evil.com" and every absolute URL scheme
 * ("https:", "javascript:", "data:") in one rule, because none of them begin
 * with a single slash.
 */
export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!candidate) return fallback;

  // Decode first so percent-encoded bypasses (%2F%2Fevil.com) are caught by the
  // same rules as their literal form. Malformed encoding is rejected outright.
  let value: string;
  try {
    value = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }

  value = value.trim();
  if (value === '') return fallback;

  if (CONTROL_CHARS.test(value)) return fallback;

  if (!/^\/[^/\\]/.test(value)) return fallback;

  return value;
}
