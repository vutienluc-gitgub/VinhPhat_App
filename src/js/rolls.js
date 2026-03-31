// ══ ROLLS — Roll table management ══

import { STATE, getXkActive } from './state.js';
import { DEFAULT_ROLLS } from './config.js';
import { safeText, fmtNum, blockNonNumeric } from './utils.js';
import { scheduleRenderPhieu } from './phieu.js';

/** Add n empty roll rows to a form type
 * @param {'nvm'|'vtp'|'xk'} type
 * @param {number} n */
export function addRolls(type, n) {
  for (let i = 0; i < n; i++) STATE[type].rolls.push({ kg: '', w: '' });
  renderRolls(type);
  if (type === 'xk') scheduleRenderPhieu();
  const c = document.getElementById(`${type}-rolls`);
  if (c) c.lastElementChild && c.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Remove up to n empty rolls from the end; prompt for filled ones */
export function removeRolls(type, n) {
  const rolls = STATE[type].rolls;
  let removed = 0;
  for (let i = rolls.length - 1; i >= 0 && removed < n; i--) {
    if (!rolls[i].kg && !rolls[i].w) {
      rolls.splice(i, 1);
      removed++;
    }
  }
  if (removed < n) {
    const remaining = n - removed;
    if (rolls.length > 0 && confirm(`Xóa ${remaining} cây có dữ liệu cuối bảng?`)) {
      rolls.splice(Math.max(0, rolls.length - remaining), remaining);
    }
  }
  if (rolls.length === 0) addRolls(type, 1);
  renderRolls(type);
  if (type === 'xk') scheduleRenderPhieu();
}

/** Reset all rolls to default count (50) with confirmation */
export function resetRolls(type) {
  if (STATE[type].rolls.some((r) => r.kg)) {
    if (!confirm('Xóa toàn bộ dữ liệu cây vải và reset về 50 dòng?')) return;
  }
  STATE[type].rolls = Array.from({ length: DEFAULT_ROLLS }, () => ({ kg: '', w: '' }));
  renderRolls(type);
  if (type === 'xk') scheduleRenderPhieu();
}

export function removeRoll(type, idx) {
  STATE[type].rolls.splice(idx, 1);
  if (STATE[type].rolls.length === 0) STATE[type].rolls.push({ kg: '', w: '' });
  renderRolls(type);
  if (type === 'xk') scheduleRenderPhieu();
}

/** Parse a raw kg input with smart decimal handling (e.g. "205" → 20.5) */
export function parseKg(raw) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const s = String(raw).trim();
  if (s.indexOf('.') !== -1 || s.indexOf(',') !== -1) {
    return parseFloat(s.replace(',', '.')) || '';
  }
  if (/^\d{3}$/.test(s)) {
    return parseFloat(s.slice(0, 2) + '.' + s.slice(2));
  }
  if (/^\d{4}$/.test(s)) {
    return parseFloat(s.slice(0, 3) + '.' + s.slice(3));
  }
  return parseFloat(s) || '';
}

export function updateRollKg(type, idx, raw) {
  const kg = parseKg(raw);
  STATE[type].rolls[idx].kg = kg;
  STATE[type].rolls[idx].rawInput = raw;

  const rows = document.querySelectorAll(`#${type}-rolls .roll-row`);
  if (rows[idx]) {
    rows[idx].classList.toggle('roll-row-filled', !!kg && parseFloat(kg) > 0);
    rows[idx].classList.remove('roll-row-empty');
  }
  updateSummary(type);
  if (type === 'xk') scheduleRenderPhieu();
}

export function updateRollW(type, idx, val) {
  STATE[type].rolls[idx].w = val;
}

export function onBlurKg(el, type, idx) {
  const kg = STATE[type].rolls[idx].kg;
  if (kg !== '' && kg !== undefined && kg !== null) {
    el.value = kg;
    STATE[type].rolls[idx].rawInput = String(kg);
  }
}

export function handleRollKey(e, type, idx) {
  if (e.key !== 'Enter' && e.key !== 'Tab') return;
  e.preventDefault();

  const rolls = STATE[type].rolls;

  if (idx >= rolls.length - 1) {
    rolls.push({ kg: '', w: '' });
    renderRolls(type);
  }

  requestAnimationFrame(() => {
    const body = document.getElementById(`${type}-rolls`);
    if (!body) return;
    const nextRow = body.children[idx + 1];
    if (!nextRow) return;
    const nextInput = nextRow.querySelector('input.roll-input');
    if (!nextInput) return;
    nextInput.focus();
    nextInput.select();
    nextRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

/** Render all roll rows for a form type into the DOM */
export function renderRolls(type) {
  const container = document.getElementById(`${type}-rolls`);
  const rolls = STATE[type].rolls;
  const XK_ACTIVE = getXkActive();
  const donGia = type === 'xk' ? (STATE.xk.items[XK_ACTIVE] ? STATE.xk.items[XK_ACTIVE].donGia || 0 : 0) : 0;
  const giaNhuom = type === 'vtp' ? parseFloat(document.getElementById('vtp-gia-nhuom').value) || 0 : 0;

  const filledCount = rolls.filter((r) => parseFloat(r.kg) > 0).length;
  const pct = rolls.length ? Math.round((filledCount / rolls.length) * 100) : 0;
  const countEl = document.getElementById(`${type}-roll-count`);
  if (countEl)
    countEl.innerHTML =
      '<span style="color:var(--green);font-weight:700">' +
      filledCount +
      '</span>' +
      '<span style="color:var(--muted)">/' +
      rolls.length +
      '</span>' +
      '<div class="roll-progress"><div class="roll-progress-bar" style="width:' + pct + '%"></div></div>';

  const frag = document.createDocumentFragment();

  rolls.forEach((r, i) => {
    const row = document.createElement('div');
    const kg = parseFloat(r.kg) || 0;
    const filled = kg > 0;
    row.className = 'roll-row ' + (filled ? 'roll-row-filled' : 'roll-row-empty');

    const num = String(i + 1).padStart(2, '0');
    const dispVal = r.rawInput !== undefined ? r.rawInput : r.kg || '';

    let c4 = '';
    if (type === 'nvm') {
      c4 = `<input class="roll-input roll-col4" placeholder="—" value="${r.w || ''}"
    inputmode="numeric" style="text-align:right;font-size:11px"
    data-roll-w="${i}" data-type="nvm">`;
    } else {
      const price = type === 'xk' ? donGia : giaNhuom;
      c4 = filled
        ? `<div class="roll-col4">${fmtNum(Math.round(kg * price))}</div>`
        : `<div class="roll-col4" style="color:#e2e8f0">0</div>`;
    }

    // Compact layout: merged dot+num, input, col4, delete
    row.innerHTML =
      `<div class="roll-num"><div class="roll-dot"></div>${num}</div>` +
      `<div><input class="roll-input" type="text" inputmode="decimal" placeholder="${type === 'nvm' ? '205' : 'kg'}"` +
      ` value="${dispVal}"` +
      ` data-roll-kg="${i}" data-type="${type}"></div>` +
      c4 +
      `<div><button class="roll-del" data-roll-del="${i}" data-type="${type}">×</button></div>`;

    frag.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(frag);

  // Setup scroll-to-top button
  _setupScrollTop(type, container);

  updateSummary(type);
}

/** Setup floating scroll-to-top for long roll lists */
function _setupScrollTop(type, container) {
  const wrap = container.closest('.roll-wrap');
  if (!wrap) return;
  let btn = wrap.querySelector('.roll-scroll-top');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'roll-scroll-top';
    btn.innerHTML = '↑';
    btn.title = 'Lên đầu';
    btn.addEventListener('click', () => {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    });
    wrap.appendChild(btn);
  }
  // Show/hide on scroll
  container.onscroll = () => {
    btn.classList.toggle('visible', container.scrollTop > 120);
  };
}

export function getLotIdForType(type) {
  if (type === 'nvm') {
    const d = (document.getElementById('nvm-ngay').value || '').replace(/-/g, '').slice(2, 8);
    return `NVM-${d || '??????'}-`;
  }
  if (type === 'vtp') {
    const lot = document.getElementById('vtp-lot-moc').value || '';
    return lot ? lot + '-' : 'NVTP-???-';
  }
  return 'PXK-VTP-???-';
}

export function updateSummary(type) {
  const rolls = STATE[type].rolls;
  const kgs = rolls.map((r) => parseFloat(r.kg) || 0).filter((k) => k > 0);
  const total = kgs.reduce((a, b) => a + b, 0);
  const filled = kgs.length;

  safeText(type + '-total-cay', filled);
  safeText(type + '-total-kg', total.toFixed(1));

  if (type === 'nvm') {
    const g = parseFloat(document.getElementById('nvm-gia-det').value) || 0;
    safeText('nvm-no-det', g && total ? fmtNum(Math.round(g * total)) + '₫' : '—');
  }
  if (type === 'vtp') {
    const g = parseFloat(document.getElementById('vtp-gia-nhuom').value) || 0;
    safeText('vtp-no-nhuom', g && total ? fmtNum(Math.round(g * total)) + '₫' : '—');
  }
  if (type === 'xk') {
    const XK_ACTIVE = getXkActive();
    const gXk = STATE.xk.items && STATE.xk.items[XK_ACTIVE] ? STATE.xk.items[XK_ACTIVE].donGia || 0 : 0;
    safeText('xk-tong-tien', gXk && total ? fmtNum(Math.round(gXk * total)) + '₫' : '—');
  }
}

export function updateVtpSummary() {
  updateSummary('vtp');
  renderRolls('vtp');
}
export function updateXkSummary() {
  updateSummary('xk');
}

// ── Event delegation for dynamically rendered roll rows ──
export function initRollDelegation() {
  ['nvm-rolls', 'vtp-rolls', 'xk-rolls'].forEach(function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('input', function (e) {
      const el = e.target;
      if (el.dataset.rollKg !== undefined) {
        updateRollKg(el.dataset.type, parseInt(el.dataset.rollKg), el.value);
      } else if (el.dataset.rollW !== undefined) {
        updateRollW(el.dataset.type, parseInt(el.dataset.rollW), el.value);
      }
    });

    container.addEventListener(
      'blur',
      function (e) {
        const el = e.target;
        if (el.dataset.rollKg !== undefined) {
          onBlurKg(el, el.dataset.type, parseInt(el.dataset.rollKg));
        }
      },
      true,
    ); // useCapture for blur

    container.addEventListener('keydown', function (e) {
      const el = e.target;
      if (el.dataset.rollKg !== undefined) {
        handleRollKey(e, el.dataset.type, parseInt(el.dataset.rollKg));
        blockNonNumeric(e, true);
      } else if (el.dataset.rollW !== undefined) {
        handleRollKey(e, el.dataset.type, parseInt(el.dataset.rollW));
        blockNonNumeric(e, false);
      }
    });

    container.addEventListener(
      'focus',
      function (e) {
        const el = e.target;
        if (el.dataset.rollKg !== undefined || el.dataset.rollW !== undefined) {
          el.select();
        }
      },
      true,
    ); // useCapture for focus

    container.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-roll-del]');
      if (btn) {
        removeRoll(btn.dataset.type, parseInt(btn.dataset.rollDel));
      }
    });
  });
}
