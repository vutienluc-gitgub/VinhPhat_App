import { describe, it, expect, beforeEach } from 'vitest';
import { updateKhDropdowns, updateNccDropdowns, updateKhTable, setSyncStatus } from '../src/js/sync.js';
import { STATE, SYNC } from '../src/js/state.js';

// ── updateKhDropdowns ─────────────────────────────────────
describe('updateKhDropdowns', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="xk-kh"></select>
      <select id="tt-kh"></select>
    `;
  });

  it('populates both dropdowns with customer list', () => {
    updateKhDropdowns([{ ten: 'Công ty A' }, { ten: 'Công ty B' }]);
    const xk = document.getElementById('xk-kh');
    const tt = document.getElementById('tt-kh');
    // placeholder + 2 options
    expect(xk.options.length).toBe(3);
    expect(tt.options.length).toBe(3);
    expect(xk.options[1].value).toBe('Công ty A');
    expect(xk.options[2].value).toBe('Công ty B');
  });

  it('escapes HTML in customer names for display text', () => {
    updateKhDropdowns([{ ten: '<b>bold</b>' }]);
    const sel = document.getElementById('xk-kh');
    // textContent returns the visible text — should show literal characters
    expect(sel.options[1].textContent).toBe('<b>bold</b>');
  });

  it('preserves previously selected value after refresh', () => {
    updateKhDropdowns([{ ten: 'Công ty A' }, { ten: 'Công ty B' }]);
    document.getElementById('xk-kh').value = 'Công ty A';
    updateKhDropdowns([{ ten: 'Công ty A' }, { ten: 'Công ty C' }]);
    expect(document.getElementById('xk-kh').value).toBe('Công ty A');
  });

  it('does not throw when dropdown elements are absent from DOM', () => {
    document.body.innerHTML = '';
    expect(() => updateKhDropdowns([{ ten: 'KH1' }])).not.toThrow();
  });

  it('handles empty list', () => {
    updateKhDropdowns([]);
    expect(document.getElementById('xk-kh').options.length).toBe(1); // only placeholder
  });
});

// ── updateNccDropdowns ────────────────────────────────────
describe('updateNccDropdowns', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="nvm-det"></select>
      <select id="vtp-det"></select>
      <select id="nvm-nhuom"></select>
      <select id="vtp-nhuom"></select>
    `;
  });

  it('routes DỆT suppliers to det dropdowns only', () => {
    updateNccDropdowns([
      { ten: 'Dệt ABC', loai: 'DỆT' },
      { ten: 'Nhuộm XYZ', loai: 'NHUỘM' },
    ]);
    const det = document.getElementById('nvm-det');
    const nhuom = document.getElementById('nvm-nhuom');
    expect(det.innerHTML).toContain('Dệt ABC');
    expect(det.innerHTML).not.toContain('Nhuộm XYZ');
    expect(nhuom.innerHTML).toContain('Nhuộm XYZ');
    expect(nhuom.innerHTML).not.toContain('Dệt ABC');
  });

  it('routes NHUỘM suppliers to nhuom dropdowns only', () => {
    updateNccDropdowns([{ ten: 'Nhuộm 123', loai: 'NHUỘM' }]);
    expect(document.getElementById('vtp-nhuom').innerHTML).toContain('Nhuộm 123');
    expect(document.getElementById('vtp-det').innerHTML).not.toContain('Nhuộm 123');
  });

  it('handles empty supplier list', () => {
    expect(() => updateNccDropdowns([])).not.toThrow();
  });

  it('does not throw when elements are absent from DOM', () => {
    document.body.innerHTML = '';
    expect(() => updateNccDropdowns([{ ten: 'X', loai: 'DỆT' }])).not.toThrow();
  });
});

// ── updateKhTable ─────────────────────────────────────────
describe('updateKhTable', () => {
  beforeEach(() => {
    document.body.innerHTML = `<table><tbody id="kh-table-body"></tbody></table>`;
  });

  it('renders one row per customer', () => {
    updateKhTable([
      { id: 'KH-001', ten: 'Công ty A', phuTrach: 'NV01' },
      { id: 'KH-002', ten: 'Công ty B', phuTrach: 'NV02' },
    ]);
    expect(document.querySelectorAll('#kh-table-body tr').length).toBe(2);
  });

  it('populates correct cell values', () => {
    updateKhTable([{ id: 'KH-001', ten: 'Công ty A', phuTrach: 'NV01' }]);
    const row = document.querySelector('#kh-table-body tr');
    expect(row.cells[0].textContent).toBe('KH-001');
    expect(row.cells[1].textContent).toBe('Công ty A');
    expect(row.cells[2].textContent).toBe('NV01');
  });

  it('clears previous rows on re-render', () => {
    updateKhTable([{ id: 'KH-001', ten: 'Old', phuTrach: '' }]);
    updateKhTable([{ id: 'KH-002', ten: 'New', phuTrach: '' }]);
    const rows = document.querySelectorAll('#kh-table-body tr');
    expect(rows.length).toBe(1);
    expect(rows[0].cells[1].textContent).toBe('New');
  });

  it('updates STATE.khCount to match list length', () => {
    updateKhTable([
      { id: 'KH-001', ten: 'A', phuTrach: '' },
      { id: 'KH-002', ten: 'B', phuTrach: '' },
      { id: 'KH-003', ten: 'C', phuTrach: '' },
    ]);
    expect(STATE.khCount).toBe(3);
  });

  it('handles phuTrach being undefined', () => {
    updateKhTable([{ id: 'KH-001', ten: 'A' }]);
    const row = document.querySelector('#kh-table-body tr');
    expect(row.cells[2].textContent).toBe('');
  });
});

// ── setSyncStatus ─────────────────────────────────────────
describe('setSyncStatus', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="gs-dot"></span>
      <span id="gs-status-text"></span>
      <span id="gs-sync-ts"></span>
      <span id="sync-last-time"></span>
      <span id="sync-state-badge"></span>
      <div id="sync-status-panel" style="display:none"></div>
      <span id="sync-kh-count"></span>
    `;
    SYNC.noKhach = [];
  });

  it('sets syncing class and status text', () => {
    setSyncStatus('syncing');
    expect(document.getElementById('gs-dot').className).toContain('syncing');
    expect(document.getElementById('gs-status-text').textContent).toBe('Đang đồng bộ...');
  });

  it('sets connected class on ok status', () => {
    setSyncStatus('ok');
    expect(document.getElementById('gs-dot').className).toContain('connected');
  });

  it('ok status makes sync-status-panel visible', () => {
    setSyncStatus('ok');
    expect(document.getElementById('sync-status-panel').style.display).toBe('block');
  });

  it('sets error class and text on error status', () => {
    setSyncStatus('error');
    expect(document.getElementById('gs-dot').className).toContain('error');
    expect(document.getElementById('gs-status-text').textContent).toBe('Mất kết nối');
  });

  it('does not throw when gs-dot element is absent', () => {
    document.body.innerHTML = '';
    expect(() => setSyncStatus('ok')).not.toThrow();
  });
});
