// ══ XK-ITEMS — Multi-item export management ══

import { HANG_DATA } from './config.js';
import { STATE, getXkActive, setXkActive } from './state.js';
import { toast } from './utils.js';
import { renderRolls, updateSummary } from './rolls.js';
import { renderPhieu, scheduleRenderPhieu } from './phieu.js';

/** Add a new empty item (hang) to the XK export order */
export function addXkItem() {
  STATE.xk.items.push({
    hang: '',
    donGia: 0,
    rolls: Array.from({ length: 50 }, function () {
      return { kg: '', w: '' };
    }),
  });
  setXkActive(STATE.xk.items.length - 1);
  renderXkTabs();
  syncItemFormToActive();
  renderRolls('xk');
  renderPhieu();
}

/** Remove an item from the XK export order with confirmation */
export function removeXkItem(idx) {
  if (STATE.xk.items.length === 1) {
    toast('Phiếu cần ít nhất 1 mặt hàng', 'error');
    return;
  }
  if (!confirm('Xóa mặt hàng ' + (STATE.xk.items[idx].hang || 'chưa chọn') + '?')) return;
  STATE.xk.items.splice(idx, 1);
  setXkActive(Math.min(getXkActive(), STATE.xk.items.length - 1));
  renderXkTabs();
  syncItemFormToActive();
  renderRolls('xk');
  renderPhieu();
}

/** Switch active XK item tab, saving current form data first */
export function switchXkItem(idx) {
  saveActiveItemFromForm();
  setXkActive(idx);
  syncItemFormToActive();
  renderXkTabs();
  renderRolls('xk');
  renderPhieu();
}

export function saveActiveItemFromForm() {
  const item = STATE.xk.items[getXkActive()];
  if (!item) return;
  const hangEl = document.getElementById('xk-item-hang');
  const giaEl = document.getElementById('xk-item-gia');
  if (hangEl) item.hang = hangEl.value || '';
  if (giaEl) item.donGia = parseFloat(giaEl.value) || 0;
}

export function syncItemFormToActive() {
  const item = STATE.xk.items[getXkActive()];
  if (!item) return;
  const hangEl = document.getElementById('xk-item-hang');
  const giaEl = document.getElementById('xk-item-gia');
  if (hangEl) {
    hangEl.value = item.hang || '';
  }
  if (giaEl) {
    giaEl.value = item.donGia > 0 ? item.donGia : '';
  }
  STATE.xk.rolls = item.rolls;
  updateItemInfoDisplay(item.hang || '');
}

/** Render the XK item tab bar reflecting current items state */
export function renderXkTabs() {
  const XK_ACTIVE = getXkActive();
  const container = document.getElementById('xk-item-tabs');
  if (!container) return;
  let html2 = '';
  STATE.xk.items.forEach(function (item, i) {
    const label = item.hang
      ? HANG_DATA[item.hang]
        ? HANG_DATA[item.hang].maHang
        : item.hang.substring(0, 6)
      : 'Hàng ' + (i + 1);
    const filled = item.rolls.filter(function (r) {
      return parseFloat(r.kg) > 0;
    }).length;
    const isActive = i === XK_ACTIVE;
    html2 +=
      '<div data-xk-tab="' +
      i +
      '" style="' +
      'display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;cursor:pointer;' +
      'background:' +
      (isActive ? 'var(--navy)' : 'var(--bg)') +
      ';' +
      'color:' +
      (isActive ? '#fff' : 'var(--muted)') +
      ';' +
      'font-size:11px;font-weight:600;border:1.5px solid ' +
      (isActive ? 'var(--navy)' : 'var(--border)') +
      ';' +
      'transition:all .15s;user-select:none' +
      '">' +
      '<span>' +
      label +
      '</span>' +
      (filled > 0
        ? '<span style="background:' +
          (isActive ? 'rgba(255,255,255,.25)' : 'var(--sky)') +
          ';color:' +
          (isActive ? '#fff' : '#fff') +
          ';border-radius:10px;padding:0 5px;font-size:10px">' +
          filled +
          '</span>'
        : '') +
      (STATE.xk.items.length > 1
        ? '<span data-xk-remove="' +
          i +
          '" style="opacity:.5;margin-left:2px;font-size:13px;line-height:1">&times;</span>'
        : '') +
      '</div>';
  });
  container.innerHTML = html2;
}

export function onItemHangChange() {
  const hangEl = document.getElementById('xk-item-hang');
  const hang = hangEl ? hangEl.value : '';
  if (STATE.xk.items[getXkActive()]) STATE.xk.items[getXkActive()].hang = hang;
  updateItemInfoDisplay(hang);
  scheduleRenderPhieu();
}

export function onItemGiaChange() {
  const giaEl = document.getElementById('xk-item-gia');
  const g = giaEl ? parseFloat(giaEl.value) || 0 : 0;
  if (STATE.xk.items[getXkActive()]) STATE.xk.items[getXkActive()].donGia = g;
  updateSummary('xk');
  scheduleRenderPhieu();
}

export function updateItemInfoDisplay(hang) {
  const el = document.getElementById('xk-item-info');
  if (!el) return;
  if (!hang || !HANG_DATA || !HANG_DATA[hang]) {
    el.style.display = 'none';
    return;
  }
  const d = HANG_DATA[hang];
  el.style.display = 'grid';
  el.innerHTML =
    '<div><span style="font-weight:700;color:var(--navy)">Mã hàng</span><br>' +
    d.maHang +
    '</div>' +
    '<div><span style="font-weight:700;color:var(--navy)">Mã màu</span><br>' +
    d.maMau +
    '</div>' +
    '<div><span style="font-weight:700;color:var(--navy)">Màu</span><br>' +
    d.mau +
    '</div>' +
    '<div><span style="font-weight:700;color:var(--navy)">Khổ</span><br>' +
    d.kho +
    '</div>';
}

// ── Event delegation for XK item tabs ──
export function initXkTabDelegation() {
  const container = document.getElementById('xk-item-tabs');
  if (!container) return;
  container.addEventListener('click', function (e) {
    const removeBtn = e.target.closest('[data-xk-remove]');
    if (removeBtn) {
      e.stopPropagation();
      removeXkItem(parseInt(removeBtn.dataset.xkRemove));
      return;
    }
    const tab = e.target.closest('[data-xk-tab]');
    if (tab) {
      switchXkItem(parseInt(tab.dataset.xkTab));
    }
  });
}
