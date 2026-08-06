import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from './redirect';

/**
 * `?redirect=` was read from the query string and handed straight to
 * router.push(), so /login?redirect=https://evil.example sent a freshly
 * authenticated user off-origin.
 */
describe('safeRedirectPath', () => {
  it('allows an ordinary internal path', () => {
    expect(safeRedirectPath('/dashboard/tasks')).toBe('/dashboard/tasks');
  });

  it('preserves query strings on internal paths', () => {
    expect(safeRedirectPath('/dashboard/partners?invite=abc')).toBe(
      '/dashboard/partners?invite=abc',
    );
  });

  it('rejects an absolute external URL', () => {
    expect(safeRedirectPath('https://evil.example/phish')).toBe('/dashboard');
    expect(safeRedirectPath('http://evil.example')).toBe('/dashboard');
  });

  it('rejects a protocol-relative URL', () => {
    expect(safeRedirectPath('//evil.example/phish')).toBe('/dashboard');
  });

  it('rejects backslash-obfuscated protocol-relative URLs', () => {
    expect(safeRedirectPath('/\\evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('\\\\evil.example')).toBe('/dashboard');
  });

  it('rejects javascript: and data: URLs', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/dashboard');
    expect(safeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
  });

  it('rejects percent-encoded bypasses', () => {
    // Decoded first, so %2F%2F is caught by the same rule as //.
    expect(safeRedirectPath('%2F%2Fevil.example')).toBe('/dashboard');
  });

  it('rejects malformed percent-encoding rather than throwing', () => {
    expect(safeRedirectPath('%E0%A4%A')).toBe('/dashboard');
  });

  it('rejects values containing control characters', () => {
    expect(safeRedirectPath('/dashboard\nSet-Cookie: x=y')).toBe('/dashboard');
  });

  it('falls back for null, undefined and empty input', () => {
    expect(safeRedirectPath(null)).toBe('/dashboard');
    expect(safeRedirectPath(undefined)).toBe('/dashboard');
    expect(safeRedirectPath('')).toBe('/dashboard');
    expect(safeRedirectPath('   ')).toBe('/dashboard');
  });

  it('honours a custom fallback', () => {
    expect(safeRedirectPath('https://evil.example', '/login')).toBe('/login');
  });
});
