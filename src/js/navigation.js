// ══ NAVIGATION — Page switching ══

import { PAGE_META } from './config.js';
import { safeText } from './utils.js';

export function showPage(name) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`)?.classList.add('active');
  const m = PAGE_META[name] || {};
  safeText('topbar-title', m.title || '');
  safeText('topbar-sub', m.sub || '');
  safeText('sheet-name-badge', m.sheet ? '→ ' + m.sheet : '');
}
