// ══ STATE — Global application state ══

export const STATE = {
  nvm: { rolls: [] },
  vtp: { rolls: [] },
  xk: {
    items: [{ hang: '', donGia: 0, rolls: Array.from({ length: 50 }, () => ({ kg: '', w: '' })) }],
  },
  pendingAction: null,
  sheetUrl: '',
  khCount: 11,
  isSubmitting: false,
};

export function xkItem(idx) {
  return STATE.xk.items[idx];
}

export const SYNC = {
  interval: null,
  polling: 30000,
  lastTs: 0,
  isLoading: false,
  connected: false,
  tonKho: null,
  ncc: [],
  khachHang: [],
};

// XK_ACTIVE cần mutable export — dùng getter/setter
let _xkActive = 0;
export function getXkActive() {
  return _xkActive;
}
export function setXkActive(val) {
  _xkActive = val;
}
