import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock headers storage with vi.hoisted to make it available before vi.mock hoisting
const { mockHeaders } = vi.hoisted(() => ({
  mockHeaders: {
    common: {} as Record<string, string | undefined>,
  },
}));

// Mock axios before importing
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: {
        headers: mockHeaders,
      },
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

// Mock universal-cookie with vi.hoisted
vi.mock('universal-cookie', () => ({
  default: class MockCookies {
    get = vi.fn().mockReturnValue('');
    remove = vi.fn();
  },
}));

// Import after mocking
import { setAuthToken } from './axios';

describe('axios config', () => {
  beforeEach(() => {
    // Clear headers before each test
    mockHeaders.common = {};
  });

  describe('setAuthToken', () => {
    it('should set both Authorization and authorization headers when token is provided', () => {
      setAuthToken('test-bearer-token');

      expect(mockHeaders.common['Authorization']).toBe('test-bearer-token');
      expect(mockHeaders.common['authorization']).toBe('test-bearer-token');
    });

    it('should set both headers to the same token value', () => {
      const token = 'Bearer xyz123';
      setAuthToken(token);

      expect(mockHeaders.common['Authorization']).toBe(token);
      expect(mockHeaders.common['authorization']).toBe(token);
      expect(mockHeaders.common['Authorization']).toBe(mockHeaders.common['authorization']);
    });

    it('should remove both Authorization and authorization headers when token is null', () => {
      // First set the headers
      mockHeaders.common['Authorization'] = 'existing-token';
      mockHeaders.common['authorization'] = 'existing-token';

      setAuthToken(null);

      expect(mockHeaders.common['Authorization']).toBeUndefined();
      expect(mockHeaders.common['authorization']).toBeUndefined();
    });

    it('should handle empty string token by removing headers', () => {
      mockHeaders.common['Authorization'] = 'existing-token';
      mockHeaders.common['authorization'] = 'existing-token';

      // Empty string is falsy, so should remove headers
      setAuthToken('');

      expect(mockHeaders.common['Authorization']).toBeUndefined();
      expect(mockHeaders.common['authorization']).toBeUndefined();
    });

    it('should preserve token format exactly as provided', () => {
      const rawToken = 'raw-token-no-bearer-prefix';
      setAuthToken(rawToken);

      expect(mockHeaders.common['Authorization']).toBe(rawToken);
      expect(mockHeaders.common['authorization']).toBe(rawToken);
    });
  });
});
