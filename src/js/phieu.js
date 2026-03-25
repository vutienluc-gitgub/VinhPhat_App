// ══ PHIEU — Phiếu giao hàng preview / print / PDF ══

import { HANG_DATA } from './config.js';
import { STATE } from './state.js';
import { escapeHtml, getVal, fmtNum, toast } from './utils.js';

let _phieuTimer = null;

/** Debounce renderPhieu calls (120ms) */
export function scheduleRenderPhieu() {
  clearTimeout(_phieuTimer);
  _phieuTimer = setTimeout(renderPhieu, 120);
}

/** Render the full phiếu giao hàng (delivery slip) preview HTML */
export function renderPhieu() {
  const el = document.getElementById('phieu-preview');
  if (!el) return;

  const ngay = getVal('xk-ngay');
  const kh = escapeHtml(getVal('xk-kh'));
  const xe = escapeHtml(getVal('xk-xe'));
  const tt = getVal('xk-tt') || 'Chưa thanh toán';
  const ghiChu = escapeHtml(getVal('xk-ghi-chu'));
  const phieuId = escapeHtml((document.getElementById('xk-id-preview') || {}).textContent || 'PXK-VTP-???');

  const allItems = STATE.xk.items || [];
  let tongCanAll = 0,
    tongCayAll = 0;
  allItems.forEach(function (item) {
    item.rolls.forEach(function (r) {
      if (parseFloat(r.kg) > 0) {
        tongCanAll += parseFloat(r.kg);
        tongCayAll++;
      }
    });
  });

  let ngayFmt = '___/___/______';
  let ngayDai = '';
  if (ngay) {
    const p = ngay.split('-');
    ngayFmt = p[2] + '/' + p[1] + '/' + p[0];
    ngayDai = 'Ngày ' + parseInt(p[2]) + ' Tháng ' + parseInt(p[1]) + ' Năm ' + p[0];
  }
  const now = new Date();
  const ngayIn =
    (now.getDate() < 10 ? '0' : '') +
    now.getDate() +
    '/' +
    (now.getMonth() < 9 ? '0' : '') +
    (now.getMonth() + 1) +
    '/' +
    now.getFullYear();

  function buildKgGrid(rollList, startNum) {
    const onlyFilled = rollList.filter(function (r) {
      return parseFloat(r.kg) > 0;
    });
    if (!onlyFilled.length) {
      return '<tr><td colspan="10" style="text-align:center;color:#bbb;font-size:10px;padding:4px">Chưa có dữ liệu</td></tr>';
    }
    const n0 = startNum || 1;
    const COLS = 10;
    let rows = '';

    const numRows = Math.ceil(onlyFilled.length / COLS);
    for (let r2 = 0; r2 < numRows; r2++) {
      rows += '<tr style="background:#f0f4f8">';
      for (let c2 = 0; c2 < COLS; c2++) {
        const i2 = r2 * COLS + c2;
        const seq = n0 + i2;
        if (i2 < onlyFilled.length) {
          rows +=
            '<td style="text-align:center;font-size:8px;color:#64748b;font-weight:700;' +
            'font-family:monospace;padding:1px 1px 0;border:0.5px solid #ccc;line-height:1.2">' +
            (seq < 10 ? '0' : '') +
            seq +
            '</td>';
        } else {
          rows += '<td style="border:0.5px solid #ccc;padding:1px">&nbsp;</td>';
        }
      }
      rows += '</tr>';

      rows += '<tr>';
      for (let c3 = 0; c3 < COLS; c3++) {
        const i3 = r2 * COLS + c3;
        if (i3 < onlyFilled.length) {
          const kg2 = parseFloat(onlyFilled[i3].kg) || 0;
          rows +=
            '<td style="text-align:center;font-size:9.5px;font-weight:700;' +
            'font-family:monospace;padding:2px 1px 3px;border:0.5px solid #ccc;' +
            'border-top:none;color:#0f2744">' +
            kg2.toFixed(1) +
            '</td>';
        } else {
          rows += '<td style="border:0.5px solid #ccc;border-top:none;padding:2px 1px">&nbsp;</td>';
        }
      }
      rows += '</tr>';
    }
    return rows;
  }

  const ttOk = tt === 'Đã thanh toán';
  const ttBadge = ttOk
    ? '<span style="background:#dcfce7;color:#166534;padding:1px 8px;border-radius:20px;font-size:8px;font-weight:700">✓ ĐÃ THANH TOÁN</span>'
    : '<span style="background:#fef9c3;color:#854d0e;padding:1px 8px;border-radius:20px;font-size:8px;font-weight:700">⏳ CHƯA THANH TOÁN</span>';

  let blockHtml = '';
  let itemStartNum = 1;
  allItems.forEach(function (item) {
    const h = item.hang || '';
    const g = item.donGia || 0;
    const d = h && HANG_DATA[h] ? HANG_DATA[h] : { maHang: '—', maMau: '—', mau: '—', kho: '—' };
    const itemFilled = item.rolls.filter(function (r) {
      return parseFloat(r.kg) > 0;
    });
    const itemCan = itemFilled.reduce(function (a, r) {
      return a + (parseFloat(r.kg) || 0);
    }, 0);
    const itemCay = itemFilled.length;
    if (!h && !itemCay) return;

    const thisStart = itemStartNum;
    itemStartNum += itemCay;
    blockHtml +=
      '<tr>' +
      '<td style="vertical-align:top;padding:5px 7px;width:190px;border:0.5px solid #bbb;background:#fafbfd">' +
      '<table style="border-collapse:collapse;width:100%;font-size:9.5px;line-height:1.75">' +
      '<tr style="background:#e8edf2"><td colspan="2" style="padding:2px 4px;font-weight:800;font-size:10px;letter-spacing:.3px">' +
      escapeHtml(h || '—') +
      '&nbsp;<span style="font-weight:400;color:#64748b">' +
      escapeHtml(d.maHang) +
      '</span></td></tr>' +
      '<tr><td style="color:#64748b">Mã màu:</td><td style="font-weight:600">' +
      escapeHtml(d.maMau) +
      '</td></tr>' +
      '<tr><td style="color:#64748b">Màu:</td><td style="font-weight:600">' +
      escapeHtml(d.mau) +
      '</td></tr>' +
      '<tr><td style="color:#64748b">Khổ:</td><td style="font-weight:600">' +
      escapeHtml(d.kho) +
      '</td></tr>' +
      '<tr style="border-top:1px solid #e2e8f0"><td style="color:#64748b">Cây:</td><td style="font-weight:800;color:#0f2744">' +
      itemCay +
      '&nbsp;/&nbsp;' +
      itemCan.toFixed(1) +
      ' kg</td></tr>' +
      (g
        ? '<tr><td style="color:#64748b">Đ.giá:</td><td style="font-weight:600;color:#00886e">' +
          fmtNum(g) +
          '₫/kg</td></tr>'
        : '') +
      '</table>' +
      '</td>' +
      '<td style="vertical-align:top;padding:2px;border:0.5px solid #bbb">' +
      '<table style="border-collapse:collapse;width:100%">' +
      '<tbody>' +
      buildKgGrid(item.rolls, thisStart) +
      '</tbody>' +
      '</table>' +
      '</td>' +
      '</tr>';
  });

  if (!blockHtml) {
    blockHtml =
      '<tr><td colspan="2" style="text-align:center;color:#bbb;padding:12px;font-size:11px">Chưa có mặt hàng nào</td></tr>';
  }

  el.innerHTML =
    '<div style="font-family:Be Vietnam Pro,Arial,sans-serif;font-size:10px;background:#fff;padding:14px 16px;max-width:740px;margin:0 auto;color:#111">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
    '<div>' +
    '<div style="font-size:20px;font-weight:900;letter-spacing:1px">PHIẾU GIAO HÀNG</div>' +
    '<div style="font-size:9px;margin-top:4px">Khách hàng: <b style="font-size:12px">' +
    (kh || 'VĨNH PHÁT') +
    '</b></div>' +
    '<div style="font-size:9px">Nơi Giao: ' +
    (xe || '') +
    '</div>' +
    '</div>' +
    '<div style="text-align:right;font-size:9px;line-height:1.8">' +
    '<div style="font-size:14px;font-weight:800;letter-spacing:.5px">' +
    phieuId +
    '</div>' +
    '<div>Người In: <b style="text-transform:uppercase">' +
    escapeHtml(localStorage.getItem('vp_nguoi_in') || 'HUONG') +
    '</b></div>' +
    '<div>Ngày In: ' +
    ngayIn +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div style="display:flex;gap:30px;font-size:9px;margin-bottom:6px;padding-bottom:4px;border-bottom:1.5px solid #333">' +
    '<span>Hóa Đơn: _______________</span>' +
    '<span>Chứng Từ: <b>' +
    phieuId +
    '</b></span>' +
    '<span>Ngày: <b>' +
    ngayFmt +
    '</b></span>' +
    ttBadge +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:6px">' +
    '<thead><tr>' +
    '<th style="background:#2d3748;color:#fff;padding:5px 8px;text-align:center;font-size:10px;border:0.5px solid #555;width:200px">Thông Tin Xuất Hàng</th>' +
    '<th style="background:#2d3748;color:#fff;padding:5px 8px;text-align:center;font-size:10px;border:0.5px solid #555" colspan="10">Danh Sách Cây Vải</th>' +
    '</tr></thead>' +
    '<tbody>' +
    blockHtml +
    '</tbody>' +
    '</table>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:#1a202c;color:#fff;border-radius:4px;margin-bottom:10px">' +
    '<span style="font-size:13px;font-weight:900">Tổng cộng: ' +
    tongCayAll +
    ' Cây - ' +
    tongCanAll.toFixed(1) +
    ' Kg</span>' +
    '<span style="font-size:10px;opacity:.7">' +
    allItems.length +
    ' loại hàng</span>' +
    '</div>' +
    (ghiChu
      ? '<div style="font-size:9px;color:#555;font-style:italic;margin-bottom:8px">Ghi chú: ' + ghiChu + '</div>'
      : '') +
    '<div style="display:flex;justify-content:flex-end;margin-bottom:14px">' +
    '<i style="font-size:10px">' +
    (ngayDai || 'Ngày ___ Tháng ___ Năm ______') +
    '</i>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;text-align:center">' +
    '<div><div style="font-size:9.5px;font-weight:700">Quản Lý</div><div style="font-size:8px;color:#888;font-style:italic">(Ký, ghi rõ họ tên)</div><div style="border-top:1px solid #999;margin:30px 10px 0"></div></div>' +
    '<div><div style="font-size:9.5px;font-weight:700">Tài Xế</div><div style="font-size:8px;color:#888;font-style:italic">(Ký, ghi rõ họ tên)</div><div style="border-top:1px solid #999;margin:30px 10px 0"></div></div>' +
    '<div><div style="font-size:9.5px;font-weight:700">Người Nhận</div><div style="font-size:8px;color:#888;font-style:italic">(Ký, ghi rõ họ tên)</div><div style="border-top:1px solid #999;margin:30px 10px 0"></div></div>' +
    '<div><div style="font-size:9.5px;font-weight:700">Người Giao</div><div style="font-size:8px;color:#888;font-style:italic">(Ký, ghi rõ họ tên)</div><div style="border-top:1px solid #999;margin:30px 10px 0"></div></div>' +
    '</div>' +
    '<div style="text-align:center;font-style:italic;font-size:9px;color:#aaa;margin-top:16px;padding-top:10px;border-top:1px dashed #ddd">We are here to serve you!</div>' +
    '</div>' +
    '<div class="phieu-actions no-print">' +
    '<button class="btn btn-print" data-action="printPhieu">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:5px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
    'In phiếu' +
    '</button>' +
    '<button class="btn btn-pdf" data-action="exportPDF">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:5px"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' +
    'Xuất PDF' +
    '</button>' +
    '<div style="margin-left:auto;font-size:11px;color:var(--muted)">' +
    '<strong style="color:#0f2744">' +
    tongCayAll +
    ' cây</strong> &nbsp;·&nbsp; ' +
    tongCanAll.toFixed(1) +
    ' kg · ' +
    allItems.length +
    ' loại hàng' +
    '</div>' +
    '</div>';
}

/** Open print dialog with the current phiếu in a new window */
export function printPhieu() {
  const previewEl = document.getElementById('phieu-preview');
  if (!previewEl) {
    toast('Chưa có phiếu để in!', 'error');
    return;
  }

  const phieuDiv = previewEl.querySelector('div');
  if (!phieuDiv) {
    toast('Phiếu chưa có dữ liệu! Hãy điền form trước.', 'error');
    return;
  }

  const fontUrl = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap';

  const printHtml =
    '<!DOCTYPE html><html lang="vi"><head>' +
    '<meta charset="UTF-8">' +
    '<title>Phiếu Giao Hàng</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="' +
    fontUrl +
    '" rel="stylesheet">' +
    '<style>' +
    '* { margin:0; padding:0; box-sizing:border-box; }' +
    'body { font-family:"Be Vietnam Pro",Arial,sans-serif; background:#fff; color:#111; padding:0; margin:0; }' +
    'table { border-collapse:collapse; }' +
    '.no-print { display:none!important; }' +
    '@page { margin:8mm 10mm; size:A4 portrait; }' +
    '@media print {' +
    '  html, body { width:100%; height:auto; }' +
    '  body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }' +
    '}' +
    '</style>' +
    '</head><body>' +
    phieuDiv.outerHTML +
    '</body></html>';

  const win = window.open('', '_blank', 'width=860,height=720,menubar=no,toolbar=no');
  if (!win) {
    toast('Trình duyệt chặn popup! Vào Settings → cho phép popup từ trang này.', 'error');
    return;
  }
  win.document.open();
  win.document.write(printHtml);
  win.document.close();

  const tryPrint = function () {
    try {
      win.focus();
      win.print();
    } catch (e) {
      toast('Lỗi in: ' + e.message, 'error');
    }
  };
  if (win.document.readyState === 'complete') {
    setTimeout(tryPrint, 700);
  } else {
    win.onload = function () {
      setTimeout(tryPrint, 500);
    };
  }
}

export function exportPDF() {
  toast('Trong hộp thoại In: chọn "Lưu dưới dạng PDF" làm máy in', 'info');
  setTimeout(function () {
    printPhieu();
  }, 300);
}

// ── Event delegation for phieu preview buttons ──
export function initPhieuDelegation() {
  const container = document.getElementById('phieu-preview');
  if (!container) return;
  container.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'printPhieu') printPhieu();
    else if (btn.dataset.action === 'exportPDF') exportPDF();
  });
}
