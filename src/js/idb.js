// ══ IDB — IndexedDB helper: drafts + outbox ══
// drafts store: lưu trạng thái form hiện tại (auto-save)
// outbox store: lưu submissions thất bại do mất mạng (auto-retry)

const DB_NAME = 'vp-app';
const DB_VERSION = 1;

let _db = null;

/** Mở (hoặc trả về) kết nối IndexedDB */
function openDb() {
  if (_db) return Promise.resolve(_db);
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts'); // key = form type (nvm/vtp/xk/tt/kh)
      }
      if (!db.objectStoreNames.contains('outbox')) {
        const outbox = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        outbox.createIndex('ts', 'ts', { unique: false });
      }
    };
    req.onsuccess = function (event) {
      _db = event.target.result;
      resolve(_db);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

// ──── DRAFTS ────────────────────────────────────────────────

/** Lưu trạng thái form vào IndexedDB (draft tự động) */
export async function saveDraft(type, data) {
  try {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').put(data, type);
      tx.oncomplete = resolve;
      tx.onerror = function () { reject(tx.error); };
    });
  } catch (err) {
    console.warn('[IDB] saveDraft error:', err);
  }
}

/** Tải draft đã lưu cho một loại form */
export async function loadDraft(type) {
  try {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('drafts', 'readonly');
      const req = tx.objectStore('drafts').get(type);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
  } catch (err) {
    console.warn('[IDB] loadDraft error:', err);
    return null;
  }
}

/** Xoá draft sau khi submit thành công */
export async function clearDraft(type) {
  try {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').delete(type);
      tx.oncomplete = resolve;
      tx.onerror = function () { reject(tx.error); };
    });
  } catch (err) {
    console.warn('[IDB] clearDraft error:', err);
  }
}

// ──── OUTBOX ────────────────────────────────────────────────

/** Thêm submission thất bại vào outbox để retry sau */
export async function addToOutbox(payload) {
  try {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('outbox', 'readwrite');
      const req = tx.objectStore('outbox').add({ payload: payload, ts: Date.now() });
      req.onsuccess = function () { resolve(req.result); }; // trả về id
      req.onerror = function () { reject(req.error); };
    });
  } catch (err) {
    console.warn('[IDB] addToOutbox error:', err);
    return null;
  }
}

/** Lấy tất cả items trong outbox */
export async function getOutbox() {
  try {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('outbox', 'readonly');
      const req = tx.objectStore('outbox').getAll();
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error); };
    });
  } catch (err) {
    console.warn('[IDB] getOutbox error:', err);
    return [];
  }
}

/** Xoá một item khỏi outbox sau khi retry thành công */
export async function removeFromOutbox(id) {
  try {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').delete(id);
      tx.oncomplete = resolve;
      tx.onerror = function () { reject(tx.error); };
    });
  } catch (err) {
    console.warn('[IDB] removeFromOutbox error:', err);
  }
}

/** Flush toàn bộ outbox — gọi khi có mạng trở lại */
export async function flushOutbox(gasUrl) {
  if (!gasUrl) return;
  const items = await getOutbox();
  if (!items.length) return;

  console.log('[IDB] Flushing outbox:', items.length, 'items');
  for (const item of items) {
    try {
      const cleanUrl = gasUrl.split('?')[0];
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(item.payload),
        redirect: 'follow',
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (data.ok) {
        await removeFromOutbox(item.id);
        console.log('[IDB] Outbox item', item.id, 'submitted OK');
      }
    } catch (err) {
      console.warn('[IDB] Outbox retry failed for item', item.id, ':', err.message);
      break; // dừng nếu vẫn không có mạng
    }
  }
}

/** Đếm số items đang chờ trong outbox */
export async function getOutboxCount() {
  try {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('outbox', 'readonly');
      const req = tx.objectStore('outbox').count();
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  } catch (err) {
    return 0;
  }
}
