// ══ ID GENERATION — Auto-generate IDs ══

import { STATE } from './state.js';
import { safeText } from './utils.js';

export function updateNvmId() {
  const d = document.getElementById('nvm-ngay').value;
  if (!d) return;
  const yr = d.slice(0, 4);
  safeText('nvm-id-preview', 'NVM-' + yr + '-???');
}

export function updateVtpId() {
  const d = document.getElementById('vtp-ngay').value;
  if (!d) return;
  const yr = d.slice(0, 4);
  safeText('vtp-id-preview', 'NVTP-' + yr + '-???');
}

export function updateXkId() {
  safeText('xk-id-preview', genXkId());
}

export function genXkId() {
  const last = parseInt(localStorage.getItem('vp_pxk_counter') || '0', 10);
  const next = last + 1;
  return 'PXK-VTP-' + String(next).padStart(3, '0');
}

export function confirmAndLockXkId() {
  const idEl = document.getElementById('xk-id-preview');
  if (!idEl) return;
  const id = idEl.textContent || '';
  const m = id.match(/(\d+)$/);
  if (m) localStorage.setItem('vp_pxk_counter', m[1]);
}

export function updateKhId() {
  const n = STATE.khCount + 1;
  safeText('kh-id-preview', 'KH-' + String(n).padStart(3, '0'));
}
