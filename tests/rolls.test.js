import { describe, it, expect } from 'vitest';
import { parseKg } from '../src/js/rolls.js';

describe('parseKg', () => {
  it('returns empty string for empty input', () => {
    expect(parseKg('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(parseKg(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(parseKg(undefined)).toBe('');
  });

  it('parses 3-digit shorthand as XX.X', () => {
    expect(parseKg('205')).toBe(20.5);
  });

  it('parses 4-digit shorthand as XXX.X', () => {
    expect(parseKg('1234')).toBe(123.4);
  });

  it('parses number with dot as-is', () => {
    expect(parseKg('20.5')).toBe(20.5);
  });

  it('parses number with comma as dot', () => {
    expect(parseKg('20,5')).toBe(20.5);
  });

  it('parses plain 2-digit number', () => {
    expect(parseKg('25')).toBe(25);
  });

  it('returns empty for non-numeric string', () => {
    expect(parseKg('abc')).toBe('');
  });

  it('parses 3-digit: 100 → 10.0', () => {
    expect(parseKg('100')).toBe(10);
  });

  it('parses 4-digit: 2500 → 250.0', () => {
    expect(parseKg('2500')).toBe(250);
  });

  it('trims whitespace', () => {
    expect(parseKg('  205  ')).toBe(20.5);
  });
});
