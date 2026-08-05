import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';

/**
 * Route protection was entirely client-side, so protected page shells and
 * their JavaScript were served to unauthenticated requests; only the
 * subsequent API calls failed.
 */
const makeRequest = (path: string, cookie?: string) =>
  new NextRequest(new URL(`https://app.alsonotify.com${path}`), {
    headers: cookie ? { cookie } : {},
  });

const SESSION = '_token=abc.def.ghi';

describe('auth middleware', () => {
  it('redirects an unauthenticated request to /dashboard', () => {
    const res = middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('preserves the original path as a redirect param', () => {
    const res = middleware(makeRequest('/dashboard/tasks'));
    expect(res.headers.get('location')).toContain(
      `redirect=${encodeURIComponent('/dashboard/tasks')}`,
    );
  });

  it('preserves the query string on the original path', () => {
    const res = middleware(makeRequest('/dashboard/partners?invite=abc'));
    expect(res.headers.get('location')).toContain(
      encodeURIComponent('/dashboard/partners?invite=abc'),
    );
  });

  it('allows an authenticated request through', () => {
    expect(middleware(makeRequest('/dashboard', SESSION)).status).toBe(200);
  });

  it('allows unauthenticated access to /login', () => {
    expect(middleware(makeRequest('/login')).status).toBe(200);
  });

  it('sends an authenticated user away from /login', () => {
    const res = middleware(makeRequest('/login', SESSION));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
  });

  it('allows unauthenticated access to the password reset flow', () => {
    expect(middleware(makeRequest('/forgot-password')).status).toBe(200);
    expect(middleware(makeRequest('/password-reset/abc123')).status).toBe(200);
  });

  it('allows unauthenticated access to /register', () => {
    expect(middleware(makeRequest('/register')).status).toBe(200);
  });

  it('does not treat a prefix collision as public', () => {
    // "/loginsomething" must not be matched by the "/login" public rule.
    const res = middleware(makeRequest('/loginsomething'));
    expect(res.status).toBe(307);
  });
});
