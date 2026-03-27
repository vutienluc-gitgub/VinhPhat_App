// ══ HISTORY — Lịch sử phiếu ══

import { escapeHtml, fmtNum, toast } from './utils.js';
import { SYNC } from './state.js';

const TYPE_LABEL = {
  nvm: 'Nhập vải mộc',
  vtp: 'Vải thành phẩm',
  xk: 'Xuất kho',
};

const TYPE_BADGE_CLASS = {
  nvm: 'badge-blue',
  vtp: 'badge-green',
  xk: 'badge-orange',
};

/** Cấu hình dropdown đối tác theo loại phiếu */
const TYPE_FILTER_CONFIG = {
  all:  { label: 'Đối tác',     placeholder: '— Tất cả —',             field: null },
  nvm:  { label: 'Nhà dệt',     placeholder: '— Tất cả nhà dệt —',     field: 'nhaDet' },
  vtp:  { label: 'Nhà nhuộm',   placeholder: '— Tất cả nhà nhuộm —',   field: 'nhaNhuom' },
  xk:   { label: 'Khách hàng',  placeholder: '— Tất cả khách hàng —',  field: 'khachHang' },
};

/** Raw data cache từ lần fetch gần nhất */
let _cache = [];

/** Khởi tạo sự kiện cho trang Lịch sử */
export function initHistory() {
  const btnLoad = document.getElementById('history-btn-load');
  const inputSearch = document.getElementById('history-search');
  const selType = document.getElementById('history-type');
  const selKH = document.getElementById('history-kh');

  if (btnLoad) {
    btnLoad.addEventListener('click', function () {
      loadHistory();
    });
  }

  // Khi đổi loại phiếu → cập nhật dropdown đối tác & lọc lại
  if (selType) {
    selType.addEventListener('input', function () {
      updateFilterDropdown();
      renderFilteredHistory();
    });
  }

  // Client-side filter chạy ngay khi gõ / đổi dropdown
  [inputSearch, selKH].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', function () {
      renderFilteredHistory();
    });
  });

  // Thiết lập trạng thái dropdown ban đầu
  updateFilterDropdown();
}

/** Fetch dữ liệu lịch sử từ GAS, áp dụng filter ngày & loại */
export async function loadHistory() {
  const url = localStorage.getItem('vp_sheet_url');
  if (!url) {
    toast('⚙ Chưa cấu hình URL Google Apps Script!', 'error');
    return;
  }

  const type = document.getElementById('history-type')?.value || 'all';
  const from = document.getElementById('history-from')?.value || '';
  const to = document.getElementById('history-to')?.value || '';

  setHistoryLoading(true);

  try {
    const params = new URLSearchParams({
      action: 'getHistory',
      type: type,
      _t: Date.now(),
    });
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const res = await fetch(url.split('?')[0] + '?' + params.toString(), {
      method: 'GET',
      redirect: 'follow',
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Phản hồi không phải JSON');
    }
    if (!data.ok) throw new Error(data.msg || 'Fetch failed');

    _cache = data.rows || [];
    updateFilterDropdown();
    renderFilteredHistory();
    updateHistoryCount(_cache.length);
  } catch (err) {
    toast('Lỗi tải lịch sử: ' + err.message, 'error');
    setHistoryLoading(false);
  }
}

/** Lọc _cache theo search text & dropdown KH, sau đó render */
function renderFilteredHistory() {
  const query = (document.getElementById('history-search')?.value || '').toLowerCase().trim();
  const filterKH = (document.getElementById('history-kh')?.value || '').toLowerCase();
  const filterType = document.getElementById('history-type')?.value || 'all';

  let rows = _cache;

  // Lọc type (nếu chưa lọc phía GAS)
  if (filterType !== 'all') {
    rows = rows.filter(function (r) {
      return r.type === filterType;
    });
  }

  // Lọc đối tác (nhà dệt / nhà nhuộm / khách hàng tuỳ loại phiếu)
  const filterConfig = TYPE_FILTER_CONFIG[filterType] || TYPE_FILTER_CONFIG['all'];
  if (filterKH && filterConfig.field) {
    rows = rows.filter(function (r) {
      return (r[filterConfig.field] || '').toLowerCase() === filterKH;
    });
  }

  // Tìm kiếm text nhanh (ID, nhà dệt, nhà nhuộm, tên hàng, khách hàng)
  if (query) {
    rows = rows.filter(function (r) {
      const haystack = [r.id, r.nhaDet, r.nhaNhuom, r.tenHang, r.khachHang, r.ngay]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  renderHistoryTable(rows);
  updateHistoryCount(rows.length, _cache.length);
}

/** Render bảng kết quả */
function renderHistoryTable(rows) {
  setHistoryLoading(false);
  const tbody = document.getElementById('history-tbody');
  const empty = document.getElementById('history-empty');
  const table = document.getElementById('history-table-wrap');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    if (table) table.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (table) table.style.display = 'block';

  tbody.innerHTML = rows
    .map(function (r) {
      const badgeClass = TYPE_BADGE_CLASS[r.type] || 'badge-blue';
      const typeLabel = TYPE_LABEL[r.type] || r.type;
      const ngayStr = formatDate(r.ngay);
      const metaLine = buildMetaLine(r);
      return (
        '<tr>' +
        '<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;white-space:nowrap">' +
        escapeHtml(r.id) +
        '</td>' +
        '<td><span class="hist-badge ' +
        badgeClass +
        '">' +
        escapeHtml(typeLabel) +
        '</span></td>' +
        '<td style="white-space:nowrap">' +
        escapeHtml(ngayStr) +
        '</td>' +
        '<td>' +
        escapeHtml(r.tenHang || '—') +
        '</td>' +
        '<td style="font-size:12px;color:var(--muted)">' +
        escapeHtml(metaLine) +
        '</td>' +
        '<td style="text-align:right;font-family:\'JetBrains Mono\',monospace;white-space:nowrap">' +
        (r.tongCay ? r.tongCay + ' cây' : '—') +
        '</td>' +
        '<td style="text-align:right;font-family:\'JetBrains Mono\',monospace;white-space:nowrap">' +
        (r.tongCan ? r.tongCan.toFixed(1) + ' kg' : '—') +
        '</td>' +
        '<td style="text-align:right;white-space:nowrap">' +
        (r.tien ? '<span style="color:var(--green);font-weight:600">' + fmtNum(r.tien) + '₫</span>' : '—') +
        '</td>' +
        '</tr>'
      );
    })
    .join('');
}

/** Tạo dòng metadata phụ tuỳ loại phiếu */
function buildMetaLine(r) {
  if (r.type === 'nvm') return [r.nhaDet, r.nhaNhuom].filter(Boolean).join(' → ');
  if (r.type === 'vtp') return [r.nhaDet, r.nhaNhuom].filter(Boolean).join(' → ');
  if (r.type === 'xk') return r.khachHang || '';
  return '';
}

/** Định dạng ngày từ chuỗi YYYY-MM-DD hoặc Date object */
function formatDate(raw) {
  if (!raw) return '—';
  const s = String(raw).substring(0, 10);
  const parts = s.split('-');
  if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
  return s;
}

function setHistoryLoading(on) {
  const loading = document.getElementById('history-loading');
  const table = document.getElementById('history-table-wrap');
  const empty = document.getElementById('history-empty');
  if (loading) loading.style.display = on ? 'flex' : 'none';
  if (on) {
    if (table) table.style.display = 'none';
    if (empty) empty.style.display = 'none';
  }
}

function updateHistoryCount(shown, total) {
  const el = document.getElementById('history-count');
  if (!el) return;
  if (total !== undefined && total !== shown) {
    el.textContent = shown + ' / ' + total + ' phiếu';
  } else {
    el.textContent = shown + ' phiếu';
  }
}

/** Cập nhật dropdown đối tác dựa theo loại phiếu đang chọn */
function updateFilterDropdown() {
  const type = document.getElementById('history-type')?.value || 'all';
  const config = TYPE_FILTER_CONFIG[type] || TYPE_FILTER_CONFIG['all'];
  const label = document.getElementById('history-kh-label');
  const sel = document.getElementById('history-kh');

  if (label) label.textContent = config.label;
  if (!sel) return;

  sel.value = '';

  if (!config.field) {
    sel.innerHTML = '<option value="">' + escapeHtml(config.placeholder) + '</option>';
    sel.disabled = true;
    return;
  }

  sel.disabled = false;

  // Trích giá trị duy nhất: ưu tiên master data từ sync, fallback cache
  const values = [];
  const seen = {};

  if (config.field === 'nhaDet') {
    SYNC.ncc.forEach(function (n) {
      var loai = (n.loai || '').toUpperCase();
      if (loai.indexOf('DỆT') !== -1 || loai.indexOf('DET') !== -1) {
        var val = (n.ten || '').trim();
        if (val && !seen[val]) { seen[val] = true; values.push(val); }
      }
    });
  } else if (config.field === 'nhaNhuom') {
    SYNC.ncc.forEach(function (n) {
      var loai = (n.loai || '').toUpperCase();
      if (loai.indexOf('NHUỘM') !== -1 || loai.indexOf('NHUOM') !== -1) {
        var val = (n.ten || '').trim();
        if (val && !seen[val]) { seen[val] = true; values.push(val); }
      }
    });
  } else if (config.field === 'khachHang') {
    SYNC.khachHang.forEach(function (kh) {
      var val = (kh.ten || '').trim();
      if (val && !seen[val]) { seen[val] = true; values.push(val); }
    });
  }

  // Bổ sung thêm từ cache (phòng trường hợp có giá trị cũ không nằm trong master data)
  _cache.forEach(function (r) {
    var val = (r[config.field] || '').trim();
    if (val && !seen[val]) { seen[val] = true; values.push(val); }
  });
  values.sort();

  let opts = '<option value="">' + escapeHtml(config.placeholder) + '</option>';
  values.forEach(function (v) {
    opts += '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>';
  });
  sel.innerHTML = opts;
}

/** Cập nhật dropdown khách hàng cho filter (gọi từ sync) */
export function updateHistoryKhFilter(khList) {
  const sel = document.getElementById('history-kh');
  if (!sel) return;
  const type = document.getElementById('history-type')?.value || 'all';
  // Chỉ cập nhật nếu đang ở chế độ xk hoặc all và chưa có cache
  if (type !== 'xk' && type !== 'all') return;
  if (_cache.length) return;
  const cur = sel.value;
  let opts = '<option value="">— Tất cả khách hàng —</option>';
  khList.forEach(function (kh) {
    opts += '<option value="' + escapeHtml(kh.ten) + '">' + escapeHtml(kh.ten) + '</option>';
  });
  sel.innerHTML = opts;
  if (cur) sel.value = cur;
}
