// ══ AUTH — PIN-based authentication & role management ══

const ROLE_LABELS = { xem: 'Xem', nhap: 'Nhập liệu', admin: 'Admin' };

const DEFAULT_PINS = { xem: '1111', nhap: '2222', admin: '0000' };

// Pages accessible per role
const ROLE_PAGES = {
  xem: ['lich-su', 'ton-kho', 'bao-cao'],
  nhap: ['nhap-moc', 'vai-tp', 'xuat-kho', 'thu-tien', 'khach-hang', 'lich-su', 'ton-kho', 'bao-cao'],
  admin: ['nhap-moc', 'vai-tp', 'xuat-kho', 'thu-tien', 'khach-hang', 'lich-su', 'ton-kho', 'bao-cao', 'cai-dat'],
};

// Default landing page per role
export const ROLE_DEFAULT_PAGE = { xem: 'lich-su', nhap: 'nhap-moc', admin: 'nhap-moc' };

/** Return the current role from sessionStorage, or null if not logged in */
export function getCurrentRole() {
  return sessionStorage.getItem('vp_role') || null;
}

/** Apply nav visibility and user badge based on role. Safe to call multiple times. */
export function applyRole(role) {
  const allowed = ROLE_PAGES[role] || [];
  document.querySelectorAll('.nav-item[data-page]').forEach(function (btn) {
    btn.style.display = allowed.includes(btn.dataset.page) ? '' : 'none';
  });

  const badge = document.getElementById('auth-user-badge');
  if (badge) {
    badge.textContent = ROLE_LABELS[role] || role;
    badge.style.display = 'inline-block';
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
}

/** Fetch PINs from GAS Config sheet and cache in localStorage (non-blocking) */
export async function fetchAndCachePins() {
  const url = localStorage.getItem('vp_sheet_url');
  if (!url) return;
  try {
    const res = await fetch(url.split('?')[0] + '?action=getConfig', {
      method: 'GET',
      redirect: 'follow',
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.ok && data.config && data.config.pins) {
      localStorage.setItem('vp_pins', JSON.stringify(data.config.pins));
    }
  } catch {
    // Offline or GAS not configured — keep using cached/default PINs
  }
}

function getPins() {
  try {
    const stored = localStorage.getItem('vp_pins');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults so all roles always have a PIN
      return Object.assign({}, DEFAULT_PINS, parsed);
    }
  } catch {}
  return Object.assign({}, DEFAULT_PINS);
}

function verifyPin(role, pin) {
  if (!role || !pin) return false;
  return getPins()[role] === pin;
}

/** Show the PIN login overlay. Returns a Promise that resolves with the chosen role. */
function showAuthOverlay() {
  return new Promise(function (resolve) {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) {
      resolve('admin');
      return;
    }

    overlay.style.display = 'flex';
    let selectedRole = 'nhap';

    const roleBtns = overlay.querySelectorAll('.auth-role-btn');

    function setActiveRole(role) {
      selectedRole = role;
      roleBtns.forEach(function (btn) {
        const isActive = btn.dataset.role === role;
        btn.style.background = isActive ? 'rgba(37,99,235,0.7)' : 'rgba(255,255,255,0.05)';
        btn.style.borderColor = isActive ? '#3b82f6' : 'rgba(255,255,255,0.15)';
        btn.style.color = isActive ? '#fff' : 'rgba(255,255,255,0.7)';
        btn.style.fontWeight = isActive ? '600' : '400';
      });
    }

    setActiveRole(selectedRole);

    roleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActiveRole(btn.dataset.role);
        document.getElementById('auth-pin').focus();
        document.getElementById('auth-error').textContent = '';
      });
    });

    function tryLogin() {
      const pin = document.getElementById('auth-pin').value.trim();
      const errEl = document.getElementById('auth-error');
      if (!pin) {
        errEl.textContent = 'Vui lòng nhập PIN.';
        return;
      }
      if (verifyPin(selectedRole, pin)) {
        sessionStorage.setItem('vp_role', selectedRole);
        overlay.style.display = 'none';
        resolve(selectedRole);
      } else {
        errEl.textContent = '❌ PIN không đúng. Vui lòng thử lại.';
        document.getElementById('auth-pin').value = '';
        document.getElementById('auth-pin').focus();
      }
    }

    document.getElementById('auth-login-btn').addEventListener('click', tryLogin);
    document.getElementById('auth-pin').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryLogin();
    });

    // Auto-focus PIN input
    setTimeout(function () {
      document.getElementById('auth-pin').focus();
    }, 100);
  });
}

/**
 * Main auth gate — call this before app init.
 * Returns a Promise<role> that resolves when the user is authenticated.
 */
export async function initAuth() {
  // Non-blocking: refresh PINs from GAS in background
  fetchAndCachePins();

  const existing = getCurrentRole();
  if (existing && ROLE_PAGES[existing]) {
    applyRole(existing);
    return existing;
  }

  const role = await showAuthOverlay();
  applyRole(role);
  return role;
}

/** Logout: clear session and reload the page */
export function logout() {
  sessionStorage.removeItem('vp_role');
  window.location.reload();
}

/** Admin-only: update a role's PIN (saves to localStorage cache, GAS update is separate) */
export function updatePin(role, newPin) {
  if (!ROLE_PAGES[role]) return false;
  const pins = getPins();
  pins[role] = newPin;
  localStorage.setItem('vp_pins', JSON.stringify(pins));
  return true;
}
