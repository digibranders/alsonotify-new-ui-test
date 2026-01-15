import { describe, it, expect } from 'vitest';
import { isNumber, isNonEmptyString, isArray, isValidHexColor, normalizeHexColor } from './validation';

describe('validation', () => {
  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1.5)).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' ')).toBe(false); // trimmed
      expect(isNonEmptyString(' a ')).toBe(true);
    });

    it('should return false for empty strings and non-strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('string')).toBe(false);
      expect(isArray(null)).toBe(false);
    });

    it('should validate items with itemGuard', () => {
      const isNumberGuard = (item: unknown): item is number => typeof item === 'number';
      expect(isArray([1, 2, 3], isNumberGuard)).toBe(true);
      expect(isArray([1, '2', 3], isNumberGuard)).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('should return true for valid hex codes', () => {
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#ABCDEF')).toBe(true);
    });

    it('should return false for invalid hex codes', () => {
      expect(isValidHexColor('fff')).toBe(false); // missing hash
      expect(isValidHexColor('#ffff')).toBe(false); // 4 digits
      expect(isValidHexColor('#ggg')).toBe(false); // invalid char
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('normalizeHexColor', () => {
    it('should normalize 3-digit hex to 6-digit', () => {
      expect(normalizeHexColor('#fff')).toBe('#ffffff');
      expect(normalizeHexColor('fff')).toBe('#ffffff');
      expect(normalizeHexColor('#000')).toBe('#000000');
    });

    it('should keep 6-digit hex as is', () => {
      expect(normalizeHexColor('#123456')).toBe('#123456');
    });

    it('should add hash if missing', () => {
      expect(normalizeHexColor('123456')).toBe('#123456');
    });
  });
});
