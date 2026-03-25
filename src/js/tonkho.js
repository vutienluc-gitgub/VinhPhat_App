// ══ TONKHO — Trang quản lý tồn kho ══

import { HANG_DATA } from './config.js';
import { escapeHtml, toast } from './utils.js';

const LOW_STOCK_THRESHOLD = 10; // cây

/** Khởi tạo sự kiện cho trang Tồn kho */
export function initTonKho() {
  const btn = document.getElementById('tonkho-btn-load');
  if (btn) btn.addEventListener('click', loadTonKho);
}

/** Fetch tồn kho từ GAS và render */
export async function loadTonKho() {
  const url = localStorage.getItem('vp_sheet_url');
  if (!url) {
    toast('⚙ Chưa cấu hình URL Google Apps Script!', 'error');
    return;
  }

  setTonKhoLoading(true);
  try {
    const fetchUrl = url.split('?')[0] + '?action=getTonKho&_t=' + Date.now();
    const res = await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Phản hồi không phải JSON');
    }
    if (!data.ok) throw new Error(data.msg || 'Fetch failed');
    renderTonKho(data.data);
  } catch (err) {
    toast('Lỗi tải tồn kho: ' + err.message, 'error');
    setTonKhoLoading(false);
  }
}

/** Render toàn bộ trang tồn kho từ data object { nvm, vtp } */
export function renderTonKho(data) {
  setTonKhoLoading(false);
  const nvmList = (data && data.nvm) || [];
  const vtpList = (data && data.vtp) || [];

  renderNvmTable(nvmList);
  renderVtpTable(vtpList);

  // Cập nhật summary cards
  const totalTonCay = vtpList.reduce(function (s, r) { return s + (r.tonCay || 0); }, 0);
  const totalTonCan = vtpList.reduce(function (s, r) { return s + (r.tonCan || 0); }, 0);
  const lowCount = vtpList.filter(function (r) { return r.tonCay < LOW_STOCK_THRESHOLD; }).length;
  const hetHang = vtpList.filter(function (r) { return r.tonCay <= 0; }).length;

  const elCay = document.getElementById('tonkho-total-cay');
  const elCan = document.getElementById('tonkho-total-can');
  const elLow = document.getElementById('tonkho-low-count');
  const elHet = document.getElementById('tonkho-het-count');
  if (elCay) elCay.textContent = totalTonCay + ' cây';
  if (elCan) elCan.textContent = totalTonCan.toFixed(1) + ' kg';
  if (elLow) elLow.textContent = lowCount;
  if (elHet) elHet.textContent = hetHang;

  updateTonKhoBadge(lowCount);
}

/** Render bảng tồn vải mộc */
function renderNvmTable(list) {
  const tbody = document.getElementById('tonkho-nvm-tbody');
  const countEl = document.getElementById('tonkho-nvm-count');
  if (!tbody) return;
  if (countEl) countEl.textContent = list.length + ' mặt hàng';

  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">Chưa có dữ liệu</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map(function (r) {
      const meta = HANG_DATA[r.tenHang] || {};
      return (
        '<tr>' +
        '<td>' + escapeHtml(r.tenHang) + '</td>' +
        '<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px">' + escapeHtml(meta.maHang || '—') + '</td>' +
        '<td>' + escapeHtml(meta.mau || '—') + '</td>' +
        '<td style="text-align:right;font-weight:600">' + r.tongCay + ' cây</td>' +
        '<td style="text-align:right">' + r.tongCan.toFixed(1) + ' kg</td>' +
        '</tr>'
      );
    })
    .join('');
}

/** Render bảng tồn vải thành phẩm (VTP − XK) */
function renderVtpTable(list) {
  const tbody = document.getElementById('tonkho-vtp-tbody');
  const countEl = document.getElementById('tonkho-vtp-count');
  if (!tbody) return;
  if (countEl) countEl.textContent = list.length + ' mặt hàng';

  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">Chưa có dữ liệu</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map(function (r) {
      const meta = HANG_DATA[r.tenHang] || {};
      const isLow = r.tonCay > 0 && r.tonCay < LOW_STOCK_THRESHOLD;
      const isEmpty = r.tonCay <= 0;
      const tonStyle = isEmpty
        ? 'color:var(--muted)'
        : isLow
        ? 'color:var(--accent);font-weight:700'
        : 'color:var(--green);font-weight:700';
      const statusBadge = isEmpty
        ? '<span class="hist-badge badge-red">Hết hàng</span>'
        : isLow
        ? '<span class="hist-badge badge-yellow">Sắp hết</span>'
        : '<span class="hist-badge badge-green">Còn hàng</span>';
      return (
        '<tr>' +
        '<td>' + escapeHtml(r.tenHang) + '</td>' +
        '<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px">' + escapeHtml(meta.maHang || '—') + '</td>' +
        '<td>' + escapeHtml(meta.kho || '—') + '</td>' +
        '<td style="text-align:right">' + r.nhapCay + ' cây / ' + r.nhapCan.toFixed(1) + ' kg</td>' +
        '<td style="text-align:right">' + r.xuatCay + ' cây / ' + r.xuatCan.toFixed(1) + ' kg</td>' +
        '<td style="text-align:right;' + tonStyle + '">' + r.tonCay + ' cây / ' + r.tonCan.toFixed(1) + ' kg</td>' +
        '<td>' + statusBadge + '</td>' +
        '</tr>'
      );
    })
    .join('');
}

/** Cập nhật badge cảnh báo tồn thấp trên nav */
export function updateTonKhoBadge(lowCount) {
  const badge = document.getElementById('tonkho-nav-badge');
  if (!badge) return;
  if (lowCount > 0) {
    badge.textContent = lowCount;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function setTonKhoLoading(on) {
  const loading = document.getElementById('tonkho-loading');
  const content = document.getElementById('tonkho-content');
  if (loading) loading.style.display = on ? 'flex' : 'none';
  if (content) content.style.display = on ? 'none' : 'block';
}
