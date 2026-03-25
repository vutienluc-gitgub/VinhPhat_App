import { describe, it, expect } from 'vitest';
import { escapeHtml, fmtNum } from '../src/js/utils.js';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('converts numbers to string', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('fmtNum', () => {
  it('formats integer with Vietnamese locale', () => {
    expect(fmtNum(1234567)).toBe('1.234.567');
  });

  it('formats zero', () => {
    expect(fmtNum(0)).toBe('0');
  });

  it('formats decimal number', () => {
    const result = fmtNum(1234.5);
    expect(result).toContain('1.234');
  });
});
