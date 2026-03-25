// ══ INIT-EVENTS — Bind all static HTML events via addEventListener ══

import { showPage } from './navigation.js';
import { blockNonNumeric } from './utils.js';
import { updateNvmId, updateVtpId, updateXkId, updateKhId } from './id-gen.js';
import { syncFromSheets, loadKhDebt } from './sync.js';
import { addRolls, removeRolls, resetRolls, updateVtpSummary, initRollDelegation } from './rolls.js';
import { addXkItem, onItemHangChange, onItemGiaChange, initXkTabDelegation } from './xk-items.js';
import { scheduleRenderPhieu, initPhieuDelegation } from './phieu.js';
import { submitForm, resetForm, closeModal, updateTtRemaining } from './forms.js';
import { saveConfig, clearConfig, testConnection, copyScript } from './settings.js';

export function initEvents() {
  // ── Navigation: data-page delegation ──
  document.addEventListener('click', function (e) {
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) {
      showPage(pageBtn.dataset.page);
      return;
    }

    // ── Roll controls: data-roll-action delegation ──
    const rollBtn = e.target.closest('[data-roll-action]');
    if (rollBtn) {
      const action = rollBtn.dataset.rollAction;
      const type = rollBtn.dataset.type;
      const count = parseInt(rollBtn.dataset.count) || 0;
      if (action === 'add') addRolls(type, count);
      else if (action === 'remove') removeRolls(type, count);
      else if (action === 'reset') resetRolls(type);
      return;
    }

    // ── Form submit: data-submit delegation ──
    const submitBtn = e.target.closest('[data-submit]');
    if (submitBtn) {
      submitForm(submitBtn.dataset.submit);
      return;
    }

    // ── Form reset: data-reset delegation ──
    const resetBtn = e.target.closest('[data-reset]');
    if (resetBtn) {
      resetForm(resetBtn.dataset.reset);
      return;
    }
  });

  // ── Settings buttons ──
  bindClick('btn-test-conn', testConnection);
  bindClick('btn-clear-config', clearConfig);
  bindClick('btn-sync-now', syncFromSheets);
  bindClick('btn-copy-script', copyScript);
  bindClick('btn-add-xk-item', addXkItem);

  // ── Modal buttons ──
  bindClick('btn-modal-close', closeModal);
  bindClick('btn-modal-cancel', closeModal);

  // ── NVM inputs ──
  bindInput('nvm-ngay', updateNvmId);
  bindInput('nvm-det', updateNvmId);
  bindKeydown('nvm-gia-det', function (e) {
    blockNonNumeric(e, false);
  });
  bindKeydown('nvm-may', function (e) {
    blockNonNumeric(e, false);
  });
  bindKeydown('nvm-tlmoc', function (e) {
    blockNonNumeric(e, false);
  });

  // ── VTP inputs ──
  bindInput('vtp-ngay', updateVtpId);
  bindInput('vtp-lot-moc', updateVtpId);
  bindInput('vtp-gia-nhuom', function () {
    updateVtpSummary();
  });
  bindKeydown('vtp-gia-nhuom', function (e) {
    blockNonNumeric(e, false);
  });

  // ── XK inputs ──
  bindInput('xk-ngay', function () {
    updateXkId();
    scheduleRenderPhieu();
  });
  bindChange('xk-kh', scheduleRenderPhieu);
  bindChange('xk-xe', scheduleRenderPhieu);
  bindChange('xk-tt', scheduleRenderPhieu);
  bindInput('xk-ghi-chu', scheduleRenderPhieu);
  bindChange('xk-item-hang', onItemHangChange);
  bindInput('xk-item-gia', onItemGiaChange);
  bindKeydown('xk-item-gia', function (e) {
    blockNonNumeric(e, false);
  });

  // ── Thu tiền inputs ──
  bindChange('tt-kh', loadKhDebt);
  bindInput('tt-so-tien', updateTtRemaining);
  bindKeydown('tt-so-tien', function (e) {
    blockNonNumeric(e, false);
  });

  // ── Khách hàng inputs ──
  bindInput('kh-ten', updateKhId);

  // ── Config inputs ──
  bindInput('cfg-url', saveConfig);
  bindInput('cfg-sheet-id', saveConfig);
  bindInput('cfg-nguoi-in', saveConfig);

  // ── Dynamic content delegation ──
  initRollDelegation();
  initXkTabDelegation();
  initPhieuDelegation();
}

// ── Helpers ──
function bindClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function bindInput(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', fn);
}

function bindChange(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', fn);
}

function bindKeydown(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', fn);
}
