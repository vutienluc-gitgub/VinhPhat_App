import { describe, it, expect, beforeEach, vi } from 'vitest';

const scheduleRenderPhieu = vi.fn();

vi.mock('../src/js/phieu.js', () => ({
  scheduleRenderPhieu,
}));

const rollsModule = await import('../src/js/rolls.js');
const { parseKg, removeRoll, removeRolls, resetRolls } = rollsModule;
const { STATE } = await import('../src/js/state.js');

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

describe('xk preview rerender on roll removal', () => {
  beforeEach(() => {
    scheduleRenderPhieu.mockClear();
    vi.stubGlobal('confirm', vi.fn(() => true));
    document.body.innerHTML = '<div id="xk-rolls"></div><span id="xk-roll-count"></span><span id="xk-total-cay"></span><span id="xk-total-kg"></span><span id="xk-tong-tien"></span>';
    STATE.xk.items = [
      {
        hang: 'VAI A',
        donGia: 10000,
        rolls: [
          { kg: '10', w: '' },
          { kg: '20', w: '' },
        ],
      },
    ];
    STATE.xk.rolls = STATE.xk.items[0].rolls;
  });

  it('removeRoll schedules preview rerender for xk', () => {
    removeRoll('xk', 0);
    expect(scheduleRenderPhieu).toHaveBeenCalledTimes(1);
  });

  it('removeRolls schedules preview rerender for xk', () => {
    removeRolls('xk', 1);
    expect(scheduleRenderPhieu).toHaveBeenCalledTimes(1);
  });

  it('resetRolls schedules preview rerender for xk', () => {
    resetRolls('xk');
    expect(scheduleRenderPhieu).toHaveBeenCalledTimes(1);
  });
});
