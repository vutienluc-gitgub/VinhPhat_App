import { describe, it, expect, beforeEach } from 'vitest';
import { STATE, SYNC, getXkActive, setXkActive } from '../src/js/state.js';

describe('STATE', () => {
  it('has nvm, vtp, xk properties', () => {
    expect(STATE).toHaveProperty('nvm');
    expect(STATE).toHaveProperty('vtp');
    expect(STATE).toHaveProperty('xk');
  });

  it('nvm and vtp start with empty rolls arrays', () => {
    expect(Array.isArray(STATE.nvm.rolls)).toBe(true);
    expect(Array.isArray(STATE.vtp.rolls)).toBe(true);
  });

  it('xk has items array with at least one item', () => {
    expect(STATE.xk.items.length).toBeGreaterThanOrEqual(1);
    expect(STATE.xk.items[0]).toHaveProperty('hang');
    expect(STATE.xk.items[0]).toHaveProperty('donGia');
    expect(STATE.xk.items[0]).toHaveProperty('rolls');
  });
});

describe('SYNC', () => {
  it('has expected properties', () => {
    expect(SYNC).toHaveProperty('polling');
    expect(SYNC).toHaveProperty('isLoading');
    expect(SYNC).toHaveProperty('connected');
  });

  it('defaults polling to 30000ms', () => {
    expect(SYNC.polling).toBe(30000);
  });
});

describe('XK_ACTIVE getter/setter', () => {
  beforeEach(() => {
    setXkActive(0);
  });

  it('defaults to 0', () => {
    expect(getXkActive()).toBe(0);
  });

  it('setter updates value', () => {
    setXkActive(3);
    expect(getXkActive()).toBe(3);
  });

  it('roundtrips correctly', () => {
    setXkActive(5);
    expect(getXkActive()).toBe(5);
    setXkActive(0);
    expect(getXkActive()).toBe(0);
  });
});
