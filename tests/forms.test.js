import { describe, it, expect, beforeEach } from 'vitest';
import { buildSummaryHtml, buildPayload, resetForm } from '../src/js/forms.js';
import { STATE, setXkActive } from '../src/js/state.js';

// ── Helpers ──────────────────────────────────────────────
function setInput(id, value) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('input');
    el.id = id;
    document.body.appendChild(el);
  }
  el.value = value;
}

function setSelect(id, value) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('select');
    el.id = id;
    document.body.appendChild(el);
  }
  el.innerHTML = value ? `<option value="${value}">${value}</option>` : '';
  el.value = value;
}

// ── buildSummaryHtml ──────────────────────────────────────
describe('buildSummaryHtml', () => {
  it('nvm: contains nhaDet, tenHang, tongCay, tongCan', () => {
    const p = { nhaDet: 'Dệt ABC', tenHang: 'Vải 1', ngay: '2026-03-25', giaDet: 5000, tongCay: 10, tongCan: 100.0 };
    const html = buildSummaryHtml('nvm', p);
    expect(html).toContain('Dệt ABC');
    expect(html).toContain('Vải 1');
    expect(html).toContain('10 cây');
    expect(html).toContain('100.0 kg');
  });

  it('nvm: calculates nợ dệt dự tính correctly', () => {
    const p = { nhaDet: 'X', tenHang: 'Y', ngay: '2026-03-25', giaDet: 5000, tongCay: 2, tongCan: 100 };
    const html = buildSummaryHtml('nvm', p);
    expect(html).toContain('500.000'); // 5000 * 100 = 500000, fmtNum -> 500.000
  });

  it('vtp: contains nhaNhuom, tonCay, giaNhuom', () => {
    const p = { lotMoc: 'L001', nhaNhuom: 'Nhuộm XYZ', tenHang: 'Vải 2', ngay: '2026-03-25', giaNhuom: 8000, tongCay: 5, tongCan: 50.0 };
    const html = buildSummaryHtml('vtp', p);
    expect(html).toContain('Nhuộm XYZ');
    expect(html).toContain('5 cây');
    expect(html).toContain('8.000'); // fmtNum(8000)
  });

  it('xk: contains khachHang, trangThai, item info', () => {
    const p = {
      khachHang: 'KH Test',
      ngay: '2026-03-25',
      tongCay: 8,
      tongCan: 80.0,
      trangThai: 'Đã thanh toán',
      items: [{ tenHang: 'Vải A', donGia: 10000, tongCan: 80, tongCay: 8 }],
    };
    const html = buildSummaryHtml('xk', p);
    expect(html).toContain('KH Test');
    expect(html).toContain('Đã thanh toán');
    expect(html).toContain('Vải A');
  });

  it('tt: contains khachHang, soTien, hinhThuc', () => {
    const p = { khachHang: 'KH Test', soTien: 5000000, ngay: '2026-03-25', hinhThuc: 'Tiền mặt' };
    const html = buildSummaryHtml('tt', p);
    expect(html).toContain('KH Test');
    expect(html).toContain('5.000.000');
    expect(html).toContain('Tiền mặt');
  });

  it('kh: contains ten and phuTrach', () => {
    const p = { ten: 'Khách Mới', ngay: '2026-03-25', phuTrach: 'Nhân viên A' };
    const html = buildSummaryHtml('kh', p);
    expect(html).toContain('Khách Mới');
    expect(html).toContain('Nhân viên A');
  });

  it('unknown type returns empty string', () => {
    expect(buildSummaryHtml('unknown', {})).toBe('');
  });

  it('escapes HTML in values to prevent XSS', () => {
    const p = { nhaDet: '<b>XSS</b>', tenHang: 'OK', ngay: '2026-03-25', giaDet: 0, tongCay: 0, tongCan: 0 };
    const html = buildSummaryHtml('nvm', p);
    expect(html).not.toContain('<b>XSS</b>');
    expect(html).toContain('&lt;b&gt;XSS&lt;/b&gt;');
  });
});

// ── buildPayload ──────────────────────────────────────────
describe('buildPayload — nvm', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="toast-container"></div>';
  });

  it('returns null when required fields are missing', () => {
    setInput('nvm-ngay', '');
    setSelect('nvm-det', '');
    setSelect('nvm-hang', '');
    expect(buildPayload('nvm')).toBeNull();
  });

  it('returns null when no kg is entered', () => {
    setInput('nvm-ngay', '2026-03-25');
    setSelect('nvm-det', 'Dệt ABC');
    setSelect('nvm-hang', 'VẢI 1');
    STATE.nvm.rolls = [{ kg: '' }, { kg: '' }];
    expect(buildPayload('nvm')).toBeNull();
  });

  it('builds correct payload with valid data', () => {
    setInput('nvm-ngay', '2026-03-25');
    setSelect('nvm-det', 'Dệt ABC');
    setSelect('nvm-hang', 'VẢI 1');
    setSelect('nvm-nhuom', 'Nhuộm XYZ');
    setInput('nvm-may', '');
    setInput('nvm-tlmoc', '');
    setInput('nvm-xe', 'XE01');
    setInput('nvm-gia-det', '5000');
    STATE.nvm.rolls = [{ kg: '20.5' }, { kg: '19.3' }, { kg: '' }];
    const p = buildPayload('nvm');
    expect(p).not.toBeNull();
    expect(p.action).toBe('nhapVaiMoc');
    expect(p.nhaDet).toBe('Dệt ABC');
    expect(p.tongCay).toBe(2);
    expect(p.tongCan).toBeCloseTo(39.8, 1);
    expect(p.kgs).toEqual([20.5, 19.3]);
  });
});

describe('buildPayload — tt', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="toast-container"></div>';
  });

  it('returns null when required fields missing', () => {
    setSelect('tt-kh', '');
    setInput('tt-so-tien', '');
    setInput('tt-ngay', '');
    expect(buildPayload('tt')).toBeNull();
  });

  it('builds correct payload', () => {
    setSelect('tt-kh', 'KH Test');
    setInput('tt-so-tien', '1000000');
    setInput('tt-ngay', '2026-03-25');
    setSelect('tt-hinh-thuc', 'Tiền mặt');
    setInput('tt-ghi-chu', 'Ghi chú');
    const p = buildPayload('tt');
    expect(p).not.toBeNull();
    expect(p.action).toBe('thuTien');
    expect(p.khachHang).toBe('KH Test');
    expect(p.soTien).toBe(1000000);
    expect(p.hinhThuc).toBe('Tiền mặt');
  });
});

describe('buildPayload — kh', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="toast-container"></div>';
  });

  it('returns null when ten is empty', () => {
    setInput('kh-ten', '   ');
    expect(buildPayload('kh')).toBeNull();
  });

  it('builds correct payload', () => {
    setInput('kh-ten', 'Công ty ABC');
    setInput('kh-ngay', '2026-03-25');
    setInput('kh-phu-trach', 'NV01');
    setInput('kh-sdt', '0901234567');
    setInput('kh-email', '');
    setInput('kh-dia-chi', '');
    setInput('kh-ghi-chu', '');
    const p = buildPayload('kh');
    expect(p).not.toBeNull();
    expect(p.action).toBe('themKH');
    expect(p.ten).toBe('Công ty ABC');
    expect(p.phuTrach).toBe('NV01');
    expect(p.sdt).toBe('0901234567');
  });
});

describe('resetForm — xk', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="xk-kh" value="Khách A">
      <input id="xk-xe" value="51A-12345">
      <input id="xk-ghi-chu" value="Ghi chú cũ">
      <input id="xk-ngay" value="2026-03-25">
      <select id="xk-tt"><option value="Chưa thanh toán">Chưa thanh toán</option><option value="Đã thanh toán" selected>Đã thanh toán</option></select>
      <select id="xk-item-hang"><option value="">— Chọn tên hàng —</option><option value="CHÂN CUA PE XÁM">CHÂN CUA PE XÁM</option></select>
      <input id="xk-item-gia" value="72000">
      <div id="xk-item-info" style="display:grid"></div>
      <div id="xk-item-tabs"></div>
      <div id="xk-rolls"></div>
      <span id="xk-roll-count"></span>
      <span id="xk-total-cay"></span>
      <span id="xk-total-kg"></span>
      <span id="xk-tong-tien"></span>
      <div id="phieu-preview"></div>
      <span id="xk-id-preview">PXK-VTP-001</span>
    `;

    STATE.xk.items = [
      {
        hang: 'CHÂN CUA PE XÁM',
        donGia: 72000,
        rolls: [{ kg: '20', w: '' }],
      },
    ];
    STATE.xk.rolls = STATE.xk.items[0].rolls;
    setXkActive(0);
    document.getElementById('xk-item-hang').value = 'CHÂN CUA PE XÁM';
  });

  it('resets xk UI from state and clears stale donGia fields', () => {
    resetForm('xk');

    expect(document.getElementById('xk-kh').value).toBe('');
    expect(document.getElementById('xk-xe').value).toBe('');
    expect(document.getElementById('xk-ghi-chu').value).toBe('');
    expect(document.getElementById('xk-item-hang').value).toBe('');
    expect(document.getElementById('xk-item-gia').value).toBe('');
    expect(document.getElementById('xk-item-info').style.display).toBe('none');
    expect(STATE.xk.items).toHaveLength(1);
    expect(STATE.xk.items[0].donGia).toBe(0);
    expect(STATE.xk.items[0].hang).toBe('');
    expect(STATE.xk.items[0].rolls).toHaveLength(50);
  });
});
