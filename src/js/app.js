// ══ APP — ES Module entry point ══

import { DEFAULT_ROLLS } from './config.js';
import { STATE } from './state.js';
import { updateNvmId, updateVtpId, updateXkId, updateKhId } from './id-gen.js';
import { startSync } from './sync.js';
import { renderRolls } from './rolls.js';
import { syncItemFormToActive, renderXkTabs } from './xk-items.js';
import { renderPhieu } from './phieu.js';
import { loadConfig } from './settings.js';
import { initEvents } from './init-events.js';
import { initHistory } from './history.js';
import { initTonKho } from './tonkho.js';
import { initBaoCao } from './baocao.js';
import { flushOutbox, getOutboxCount } from './idb.js';
import { initAuth, ROLE_DEFAULT_PAGE } from './auth.js';
import { showPage } from './navigation.js';

// ── Set date defaults (safe to run before auth) ──
const today = new Date().toISOString().split('T')[0];
['nvm-ngay', 'vtp-ngay', 'xk-ngay', 'tt-ngay', 'kh-ngay'].forEach(function (id) {
  const el = document.getElementById(id);
  if (el) el.value = today;
});

// ── Auth gate: everything else runs after login ──
initAuth().then(function (role) {
  loadConfig();
  updateNvmId();
  updateVtpId();
  updateXkId();
  updateKhId();

  ['nvm', 'vtp', 'xk'].forEach(function (t) {
    STATE[t].rolls = Array.from({ length: DEFAULT_ROLLS }, function () {
      return { kg: '', w: '' };
    });
    renderRolls(t);
  });

  // Bind all events (replaces inline handlers)
  initEvents();
  initHistory();
  initTonKho();
  initBaoCao();

  // Navigate to the default page for this role
  showPage(ROLE_DEFAULT_PAGE[role] || 'nhap-moc');

  setTimeout(function () {
    STATE.xk.rolls = STATE.xk.items[0].rolls;
    syncItemFormToActive();
    renderXkTabs();
    renderPhieu();
    startSync();
  }, 80);

  // ── Offline / Online handling ──
  window.addEventListener('online', function () {
    const url = localStorage.getItem('vp_sheet_url');
    if (url) {
      flushOutbox(url).then(function () {
        updateOutboxBadge();
      });
    }
  });

  // Kiểm tra badge outbox khi khởi động
  getOutboxCount().then(function (count) {
    if (count > 0) updateOutboxBadge(count);
  });
});

/** Cập nhật badge số items đang chờ trong outbox */
function updateOutboxBadge(count) {
  const update = function (n) {
    const badge = document.getElementById('outbox-badge');
    if (!badge) return;
    const span = badge.querySelector('span');
    if (span) span.textContent = n;
    badge.style.display = n > 0 ? 'inline-flex' : 'none';
  };
  if (count !== undefined) {
    update(count);
  } else {
    getOutboxCount().then(update);
  }
}
