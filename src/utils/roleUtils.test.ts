import { describe, it, expect } from 'vitest';
import { getRoleFromUser } from './roleUtils';

describe('roleUtils', () => {
  describe('getRoleFromUser', () => {
    describe('null/undefined handling', () => {
      it('should return Employee for null user', () => {
        expect(getRoleFromUser(null)).toBe('Employee');
      });

      it('should return Employee for undefined user', () => {
        expect(getRoleFromUser(undefined)).toBe('Employee');
      });
    });

    describe('role.name based detection', () => {
      it('should return Admin when role name contains "admin" (case insensitive)', () => {
        expect(getRoleFromUser({ role: { name: 'Admin' } })).toBe('Admin');
        expect(getRoleFromUser({ role: { name: 'ADMIN' } })).toBe('Admin');
        expect(getRoleFromUser({ role: { name: 'Super Admin' } })).toBe('Admin');
        expect(getRoleFromUser({ role: { name: 'administrator' } })).toBe('Admin');
      });

      it('should return Manager when role name contains "manager"', () => {
        expect(getRoleFromUser({ role: { name: 'Manager' } })).toBe('Manager');
        expect(getRoleFromUser({ role: { name: 'Project Manager' } })).toBe('Manager');
        expect(getRoleFromUser({ role: { name: 'MANAGER' } })).toBe('Manager');
      });

      it('should return Leader when role name contains "leader"', () => {
        expect(getRoleFromUser({ role: { name: 'Leader' } })).toBe('Leader');
        expect(getRoleFromUser({ role: { name: 'Team Leader' } })).toBe('Leader');
        expect(getRoleFromUser({ role: { name: 'LEADER' } })).toBe('Leader');
      });

      it('should return Employee when role name is exactly "hr" (not combined)', () => {
        // Note: HR alone maps to Employee, but "HR Manager" will match Manager first
        // due to the order of checks in the implementation
        expect(getRoleFromUser({ role: { name: 'HR' } })).toBe('Employee');
      });

      it('should return Employee when role name is exactly "finance" (not combined)', () => {
        // Note: Finance alone maps to Employee
        expect(getRoleFromUser({ role: { name: 'Finance' } })).toBe('Employee');
      });

      it('should check admin before hr (HR Admin returns Admin)', () => {
        // "HR Admin" contains both "admin" and "hr", admin is checked first
        expect(getRoleFromUser({ role: { name: 'HR Admin' } })).toBe('Admin');
      });

      it('should check manager before hr (HR Manager returns Manager)', () => {
        // "HR Manager" contains both "manager" and "hr", manager is checked first
        expect(getRoleFromUser({ role: { name: 'HR Manager' } })).toBe('Manager');
      });
    });

    describe('user_employee.role.name based detection', () => {
      it('should detect role from user_employee.role.name', () => {
        expect(getRoleFromUser({ user_employee: { role: { name: 'Admin' } } })).toBe('Admin');
        expect(getRoleFromUser({ user_employee: { role: { name: 'Manager' } } })).toBe('Manager');
        expect(getRoleFromUser({ user_employee: { role: { name: 'Leader' } } })).toBe('Leader');
      });
    });

    describe('role_id fallback', () => {
      it('should return Admin for role_id 1', () => {
        expect(getRoleFromUser({ role_id: 1 })).toBe('Admin');
      });

      it('should return Employee for role_id 2', () => {
        expect(getRoleFromUser({ role_id: 2 })).toBe('Employee');
      });

      it('should return Employee for role_id 3 (HR)', () => {
        expect(getRoleFromUser({ role_id: 3 })).toBe('Employee');
      });

      it('should return Admin for role_id 4', () => {
        expect(getRoleFromUser({ role_id: 4 })).toBe('Admin');
      });

      it('should return Leader for role_id 5', () => {
        expect(getRoleFromUser({ role_id: 5 })).toBe('Leader');
      });

      it('should return Employee for role_id 6 (Finance)', () => {
        expect(getRoleFromUser({ role_id: 6 })).toBe('Employee');
      });

      it('should return Manager for role_id 7', () => {
        expect(getRoleFromUser({ role_id: 7 })).toBe('Manager');
      });

      it('should use user_employee.role_id as fallback', () => {
        expect(getRoleFromUser({ user_employee: { role_id: 1 } })).toBe('Admin');
        expect(getRoleFromUser({ user_employee: { role_id: 7 } })).toBe('Manager');
      });

      it('should use role.id as fallback', () => {
        expect(getRoleFromUser({ role: { id: 1 } })).toBe('Admin');
        expect(getRoleFromUser({ role: { id: 5 } })).toBe('Leader');
      });
    });

    describe('missing optional fields handling', () => {
      it('should not throw on empty user object', () => {
        expect(() => getRoleFromUser({})).not.toThrow();
        expect(getRoleFromUser({})).toBe('Employee');
      });

      it('should not throw when role is null', () => {
        expect(() => getRoleFromUser({ role: null })).not.toThrow();
        expect(getRoleFromUser({ role: null })).toBe('Employee');
      });

      it('should not throw when user_employee is null', () => {
        expect(() => getRoleFromUser({ user_employee: null })).not.toThrow();
        expect(getRoleFromUser({ user_employee: null })).toBe('Employee');
      });

      it('should not throw when user_employee.role is null', () => {
        expect(() => getRoleFromUser({ user_employee: { role: null } })).not.toThrow();
        expect(getRoleFromUser({ user_employee: { role: null } })).toBe('Employee');
      });

      it('should not throw with deeply nested missing fields', () => {
        const user = {
          role: undefined,
          role_id: undefined,
          user_employee: {
            role: undefined,
            role_id: undefined,
          },
        };
        expect(() => getRoleFromUser(user)).not.toThrow();
        expect(getRoleFromUser(user)).toBe('Employee');
      });
    });

    describe('unknown role handling', () => {
      it('should return Employee for unknown role_id', () => {
        expect(getRoleFromUser({ role_id: 999 })).toBe('Employee');
        expect(getRoleFromUser({ role_id: 0 })).toBe('Employee');
        expect(getRoleFromUser({ role_id: -1 })).toBe('Employee');
      });

      it('should return Employee for unknown role name', () => {
        expect(getRoleFromUser({ role: { name: 'Unknown Role' } })).toBe('Employee');
        expect(getRoleFromUser({ role: { name: 'Custom' } })).toBe('Employee');
      });
    });

    describe('priority order', () => {
      it('should prioritize role.name over role_id', () => {
        // role.name says Manager but role_id says Admin
        const user = { role: { name: 'Manager' }, role_id: 1 };
        expect(getRoleFromUser(user)).toBe('Manager');
      });

      it('should prioritize role.name over user_employee.role_id', () => {
        const user = { role: { name: 'Leader' }, user_employee: { role_id: 1 } };
        expect(getRoleFromUser(user)).toBe('Leader');
      });
    });
  });
});
