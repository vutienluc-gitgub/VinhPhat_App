// ══ SETTINGS — Config, connection, Google Apps Script ══

import { toast } from './utils.js';
import { startSync, stopSync, updateConnStatus, setSyncStatus } from './sync.js';

/** Load saved config from localStorage into settings form */
export function loadConfig() {
  const url = localStorage.getItem('vp_sheet_url') || '';
  const sid = localStorage.getItem('vp_sheet_id') || '';
  const nguoiIn = localStorage.getItem('vp_nguoi_in') || 'HUONG';
  document.getElementById('cfg-url').value = url;
  document.getElementById('cfg-sheet-id').value = sid;
  const nguoiInEl = document.getElementById('cfg-nguoi-in');
  if (nguoiInEl) nguoiInEl.value = nguoiIn;
  updateConnStatus(!!url);
}

/** Save current settings form values to localStorage and restart sync */
export function saveConfig() {
  localStorage.setItem('vp_sheet_url', document.getElementById('cfg-url').value);
  localStorage.setItem('vp_sheet_id', document.getElementById('cfg-sheet-id').value);
  const nguoiInEl = document.getElementById('cfg-nguoi-in');
  if (nguoiInEl) localStorage.setItem('vp_nguoi_in', nguoiInEl.value.trim() || 'HUONG');
  updateConnStatus(!!document.getElementById('cfg-url').value);
  startSync();
}

export function clearConfig() {
  stopSync();
  localStorage.removeItem('vp_sheet_url');
  localStorage.removeItem('vp_sheet_id');
  document.getElementById('cfg-url').value = '';
  document.getElementById('cfg-sheet-id').value = '';
  updateConnStatus(false);
  setSyncStatus('error');
  const panel = document.getElementById('sync-status-panel');
  if (panel) panel.style.display = 'none';
  toast('Đã xóa cấu hình', 'info');
}

/** Test the Google Apps Script connection with a ping request */
export async function testConnection() {
  const urlInput = document.getElementById('cfg-url').value.trim();
  if (!urlInput) {
    toast('Nhập URL trước!', 'error');
    return;
  }

  const el = document.getElementById('conn-result');
  el.style.display = 'block';
  el.style.background = '#e8f4fd';
  el.style.color = '#1a4f8a';
  el.innerHTML = '🔄 Đang kiểm tra kết nối...';

  const baseUrl = urlInput.split('?')[0];

  try {
    const pingUrl = baseUrl + '?action=ping';
    const res = await fetch(pingUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Phản hồi không phải JSON. URL có thể sai hoặc chưa deploy đúng.');
    }

    if (data && data.ok) {
      el.style.background = '#e0f9f3';
      el.style.color = '#00886e';
      el.innerHTML =
        '✅ Kết nối thành công! ' +
        (data.msg || '') +
        '<br>' +
        '<span style="font-size:11px;opacity:.7">URL đã lưu. Đang tải dữ liệu từ Sheets...</span>';
      localStorage.setItem('vp_sheet_url', baseUrl);
      document.getElementById('cfg-url').value = baseUrl;
      updateConnStatus(true);
      startSync();
    } else {
      el.style.background = '#fdecea';
      el.style.color = '#c0392b';
      el.textContent = '❌ Script trả lỗi: ' + (data && data.msg ? data.msg : 'Không rõ');
    }
  } catch (err) {
    el.style.background = '#fdecea';
    el.style.color = '#c0392b';
    el.innerHTML =
      '❌ Không kết nối được.<br>' +
      '<span style="font-size:11px">' +
      'Nguyên nhân thường gặp:<br>' +
      '① URL sai — kiểm tra lại link trong Apps Script<br>' +
      '② Chưa deploy — Deploy → New deployment → Web app<br>' +
      '③ Quyền sai — "Execute as: Me" + "Who has access: Anyone"<br>' +
      '④ Chưa allow quyền lần đầu — Deploy xong phải nhấn Allow' +
      '</span><br>' +
      '<span style="font-size:10px;opacity:.6;font-family:monospace">' +
      err.message +
      '</span>';
  }
}

export function copyScript() {
  const code = document.getElementById('gas-code').textContent;
  navigator.clipboard.writeText(code).then(function () {
    toast('✓ Đã copy code Apps Script!', 'success');
  });
}
