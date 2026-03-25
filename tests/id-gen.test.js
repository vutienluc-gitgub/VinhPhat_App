import { describe, it, expect, beforeEach } from 'vitest';
import { genXkId } from '../src/js/id-gen.js';

describe('genXkId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates PXK-VTP-001 when counter is 0', () => {
    expect(genXkId()).toBe('PXK-VTP-001');
  });

  it('increments from stored counter', () => {
    localStorage.setItem('vp_pxk_counter', '5');
    expect(genXkId()).toBe('PXK-VTP-006');
  });

  it('pads number to 3 digits', () => {
    localStorage.setItem('vp_pxk_counter', '99');
    expect(genXkId()).toBe('PXK-VTP-100');
  });

  it('handles large counter values', () => {
    localStorage.setItem('vp_pxk_counter', '999');
    expect(genXkId()).toBe('PXK-VTP-1000');
  });
});
