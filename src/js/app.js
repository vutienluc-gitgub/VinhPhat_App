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

// ── Init ──
const today = new Date().toISOString().split('T')[0];
['nvm-ngay', 'vtp-ngay', 'xk-ngay', 'tt-ngay', 'kh-ngay'].forEach(function (id) {
  const el = document.getElementById(id);
  if (el) el.value = today;
});

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

setTimeout(function () {
  STATE.xk.rolls = STATE.xk.items[0].rolls;
  syncItemFormToActive();
  renderXkTabs();
  renderPhieu();
  startSync();
}, 80);
