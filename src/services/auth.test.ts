
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from './auth';
import axiosApi from '../config/axios';

// Mock axios
vi.mock('../config/axios', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    default: {
      post: vi.fn(),
      get: vi.fn(),
    },
    setAuthToken: vi.fn(),
  };
});

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('doLogin', () => {
    it('should return data on successful login', async () => {
      const mockResponse = { data: { success: true, result: { token: 'abc', user: { id: 1, name: 'Test' } } } };
      (axiosApi.post as any).mockResolvedValue(mockResponse);

      const result = await authService.doLogin({ email: 'test@example.com', password: 'password' });
      expect(result).toEqual(mockResponse.data);
      expect(axiosApi.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'password' });
    });
  });

  describe('doSignup', () => {
    it('should call register endpoint with correct payload', async () => {
      const mockResponse = { data: { success: true, result: { token: 'xyz' } } };
      (axiosApi.post as any).mockResolvedValue(mockResponse);

      const result = await authService.doSignup('John', 'Doe', 'john@example.com', 'password', 'token123');
      expect(result).toEqual(mockResponse.data);
      expect(axiosApi.post).toHaveBeenCalledWith('/auth/register', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password',
        token: 'token123'
      });
    });
  });

  describe('verifyRegisterToken', () => {
    it('should verify token via get request', async () => {
      const mockResponse = { data: { success: true, result: { valid: true } } };
      (axiosApi.get as any).mockResolvedValue(mockResponse);

      const result = await authService.verifyRegisterToken('valid-token');
      expect(result).toEqual(mockResponse.data);
      expect(axiosApi.get).toHaveBeenCalledWith('/auth/register/verify-token?registerToken=valid-token');
    });
  });
});
