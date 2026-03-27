// ══ SYNC ENGINE — Realtime data sync with Google Sheets ══

import { STATE, SYNC } from './state.js';
import { escapeHtml, safeText, fmtNum } from './utils.js';
import { updateKhId } from './id-gen.js';
import { updateHistoryKhFilter } from './history.js';
import { renderTonKho } from './tonkho.js';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;
let _retryCount = 0;

/** Start polling sync with Google Sheets (30s interval) */
export function startSync() {
  const url = localStorage.getItem('vp_sheet_url');
  if (!url) return;
  _retryCount = 0;
  syncFromSheets();
  if (SYNC.interval) clearInterval(SYNC.interval);
  SYNC.interval = setInterval(syncFromSheets, SYNC.polling);
}

/** Stop the sync polling interval */
export function stopSync() {
  if (SYNC.interval) {
    clearInterval(SYNC.interval);
    SYNC.interval = null;
  }
}

/** Fetch all data from Google Sheets via Apps Script API */
export async function syncFromSheets() {
  const url = localStorage.getItem('vp_sheet_url');
  if (!url || SYNC.isLoading) return;
  SYNC.isLoading = true;
  setSyncStatus('syncing');
  try {
    const fetchUrl = url.split('?')[0] + '?action=getAll&_t=' + Date.now();
    const res = await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Phản hồi không phải JSON — kiểm tra lại GAS đã deploy chưa');
    }
    if (!data.ok) throw new Error(data.msg || 'Sync failed');

    if (data.khachHang && data.khachHang.length) {
      updateKhDropdowns(data.khachHang);
      updateKhTable(data.khachHang);
      updateHistoryKhFilter(data.khachHang);
    }
    if (data.ncc && data.ncc.length) {
      updateNccDropdowns(data.ncc);
    }
    if (data.noKhach) {
      SYNC.noKhach = data.noKhach;
    }
    if (data.tonKho) {
      SYNC.tonKho = data.tonKho;
      renderTonKho(data.tonKho);
    }
    if (data.seq) {
      SYNC.seq = data.seq;
      if (data.seq.pxk) {
        const pxkId = 'PXK-VTP-' + String(data.seq.pxk).padStart(3, '0');
        safeText('xk-id-preview', pxkId);
        localStorage.setItem('vp_pxk_counter', String(data.seq.pxk - 1));
      }
    }

    SYNC.lastTs = data.ts || Date.now();
    SYNC.connected = true;
    _retryCount = 0;
    setSyncStatus('ok');
  } catch (err) {
    SYNC.connected = false;
    setSyncStatus('error');
    console.warn('Sync error:', err.message);
    if (_retryCount < MAX_RETRIES) {
      _retryCount++;
      const delay = RETRY_BASE_MS * Math.pow(2, _retryCount - 1);
      console.warn(`Sync retry ${_retryCount}/${MAX_RETRIES} in ${delay}ms`);
      setTimeout(syncFromSheets, delay);
    }
  } finally {
    SYNC.isLoading = false;
  }
}

/** Populate customer dropdowns from sheet data */
export function updateKhDropdowns(khList) {
  let opts = '<option value="">— Chọn khách hàng —</option>';
  khList.forEach(function (kh) {
    const safeTen = escapeHtml(kh.ten);
    opts += '<option value="' + safeTen + '">' + safeTen + '</option>';
  });
  ['xk-kh', 'tt-kh'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = opts;
    if (cur) el.value = cur;
  });
}

/** Populate supplier (dệt/nhuộm) dropdowns from sheet data */
export function updateNccDropdowns(nccList) {
  let detOpts = '<option value="">— Chọn nhà dệt —</option>';
  let nhuomOpts = '<option value="">— Chọn nhà nhuộm —</option>';
  nccList.forEach(function (n) {
    const loai = (n.loai || '').toUpperCase();
    const safeTen = escapeHtml(n.ten);
    const opt = '<option>' + safeTen + '</option>';
    if (loai.indexOf('DỆT') !== -1 || loai.indexOf('DET') !== -1) detOpts += opt;
    if (loai.indexOf('NHUỘM') !== -1 || loai.indexOf('NHUOM') !== -1) nhuomOpts += opt;
  });
  ['nvm-det', 'vtp-det'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = detOpts;
    if (cur) el.value = cur;
  });
  ['nvm-nhuom', 'vtp-nhuom'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = nhuomOpts;
    if (cur) el.value = cur;
  });
}

/** Rebuild the customer table in KH management page */
export function updateKhTable(khList) {
  const tbody = document.getElementById('kh-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  khList.forEach(function (kh) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = kh.id;
    const td2 = document.createElement('td');
    td2.textContent = kh.ten;
    const td3 = document.createElement('td');
    td3.textContent = kh.phuTrach || '';
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);
  });
  STATE.khCount = khList.length;
  updateKhId();
}

/** Load and display debt info for the selected customer */
export function loadKhDebt() {
  const kh = document.getElementById('tt-kh');
  if (!kh || !kh.value) {
    document.getElementById('tt-debt-info').style.display = 'none';
    return;
  }
  const tenKH = kh.value;
  document.getElementById('tt-debt-info').style.display = 'block';

  const noData = (SYNC.noKhach || []).find(function (n) {
    return n.ten === tenKH;
  });
  if (noData) {
    safeText('tt-tong-mua', fmtNum(noData.tongNo) + '₫');
    safeText('tt-da-tt', fmtNum(noData.daTT) + '₫');
    safeText('tt-con-no', fmtNum(Math.max(0, noData.conNo)) + '₫');
    const conNoEl = document.getElementById('tt-con-no');
    if (conNoEl) conNoEl.style.color = noData.conNo > 0 ? 'var(--red)' : 'var(--green)';
  } else {
    safeText('tt-tong-mua', '—');
    safeText('tt-da-tt', '—');
    safeText('tt-con-no', '—');
  }
}

export function setSyncStatus(status) {
  const dot = document.getElementById('gs-dot');
  const text = document.getElementById('gs-status-text');
  const ts = document.getElementById('gs-sync-ts');
  if (!dot) return;

  if (status === 'syncing') {
    dot.className = 'gs-dot syncing';
    if (text) text.textContent = 'Đang đồng bộ...';
  } else if (status === 'ok') {
    dot.className = 'gs-dot connected';
    const now = new Date();
    const hhmm =
      (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    if (text) text.textContent = 'Đồng bộ ' + hhmm;
    if (ts) ts.textContent = hhmm;
    safeText('sync-last-time', hhmm);
    safeText('sync-state-badge', '✓ Đang hoạt động');
    const badge = document.getElementById('sync-state-badge');
    if (badge) badge.style.color = 'var(--green)';
    const panel = document.getElementById('sync-status-panel');
    if (panel) panel.style.display = 'block';
    if (SYNC.noKhach) safeText('sync-kh-count', (SYNC.noKhach.length || 0) + ' KH');
  } else {
    dot.className = 'gs-dot error';
    if (text) text.textContent = 'Mất kết nối';
  }
}

export function updateConnStatus(connected) {
  document.getElementById('gs-dot').className = 'gs-dot' + (connected ? ' connected' : '');
  safeText('gs-status-text', connected ? 'Đã cấu hình' : 'Chưa kết nối');
}
