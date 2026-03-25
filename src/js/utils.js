// ══ UTILS — DOM helpers & formatting ══

/** Escape HTML special characters to prevent XSS */
export function escapeHtml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Set textContent of an element by id */
export function safeText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/** Set innerHTML of an element by id */
export function safeHtml(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

/** Set value of an input element by id */
export function safeVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

/** Get value of an input element by id (empty string if not found) */
export function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/** Get numeric value of an input element by id (0 if NaN) */
export function getNum(id) {
  return parseFloat(getVal(id)) || 0;
}

/** Prevent non-numeric key input; optionally allow a single decimal dot */
export function blockNonNumeric(e, allowDot) {
  const k = e.key;
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];
  if (allowed.indexOf(k) !== -1) return;
  if (e.ctrlKey || e.metaKey) return;
  if (allowDot && k === '.') {
    const val = e.target.value || '';
    if (val.indexOf('.') !== -1) e.preventDefault();
    return;
  }
  if (!/^[0-9]$/.test(k)) e.preventDefault();
}

/** Format number with Vietnamese locale separators */
export function fmtNum(n) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

/** Show a temporary toast notification
 * @param {string} msg
 * @param {'info'|'success'|'error'} type */
export function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'slideOut .25s ease forwards';
    setTimeout(() => t.remove(), 250);
  }, 3200);
}
