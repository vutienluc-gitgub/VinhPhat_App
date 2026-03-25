// ══ APP CONFIG — Default application settings ══
// Import vào config.js hoặc state.js nếu muốn tập trung quản lý hằng số.
// Hiện tại để tham chiếu, các giá trị gốc nằm trong config.js và state.js.

/** Số cuộn mặc định khi tạo mới phiếu */
export const DEFAULT_ROLLS = 50;

/** Khoảng thời gian polling đồng bộ Google Sheets (ms) */
export const SYNC_POLLING_MS = 30_000;

/** Prefix ID cho từng loại phiếu */
export const ID_PREFIX = {
  nhapVaiMoc: 'NVM',
  vaiThanhPham: 'NVTP',
  xuatKho: 'PXK-VTP',
  khachHang: 'KH',
};

/** Delay khởi tạo sync sau khi app load (ms) */
export const INIT_DELAY_MS = 80;

/** LocalStorage keys */
export const STORAGE_KEYS = {
  sheetUrl: 'vp_sheetUrl',
  config: 'vp_config',
};
