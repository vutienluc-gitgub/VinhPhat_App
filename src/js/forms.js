// ══ FORMS — Submit, confirm, reset logic ══

import { DEFAULT_ROLLS } from './config.js';
import { STATE, SYNC, setXkActive } from './state.js';
import { escapeHtml, getVal, safeText, safeHtml, fmtNum, toast } from './utils.js';
import { showPage } from './navigation.js';
import { updateNvmId, updateXkId, updateKhId, confirmAndLockXkId } from './id-gen.js';
import { syncFromSheets } from './sync.js';
import { renderRolls } from './rolls.js';
import { saveActiveItemFromForm, renderXkTabs, syncItemFormToActive } from './xk-items.js';
import { renderPhieu } from './phieu.js';
import { saveDraft, clearDraft, addToOutbox } from './idb.js';

function getXkStockIssue(items) {
  const tonKhoVtp = (SYNC.tonKho && SYNC.tonKho.vtp) || [];
  if (!tonKhoVtp.length) return null;

  const tonMap = tonKhoVtp.reduce(function (acc, row) {
    const tenHang = String((row && row.tenHang) || '').trim();
    if (!tenHang) return acc;
    acc[tenHang] = {
      tonCay: parseInt(row.tonCay, 10) || 0,
      tonCan: parseFloat(row.tonCan) || 0,
    };
    return acc;
  }, {});

  const requestedMap = {};
  for (let i = 0; i < items.length; i++) {
    const item = items[i] || {};
    const tenHang = String(item.tenHang || '').trim();
    if (!tenHang) {
      return 'Mỗi mặt hàng có cây xuất phải chọn tên hàng!';
    }
    if (!requestedMap[tenHang]) {
      requestedMap[tenHang] = { tongCay: 0, tongCan: 0 };
    }
    requestedMap[tenHang].tongCay += parseInt(item.tongCay, 10) || 0;
    requestedMap[tenHang].tongCan += parseFloat(item.tongCan) || 0;
  }

  const tenHangs = Object.keys(requestedMap);
  for (let i = 0; i < tenHangs.length; i++) {
    const tenHang = tenHangs[i];
    const requested = requestedMap[tenHang];
    const available = tonMap[tenHang] || { tonCay: 0, tonCan: 0 };
    const vuotCay = requested.tongCay > available.tonCay;
    const vuotCan = requested.tongCan > available.tonCan + 0.001;
    if (vuotCay || vuotCan) {
      return (
        'Xuất vượt tồn kho cho ' +
        tenHang +
        ': tồn ' +
        available.tonCay +
        ' cây / ' +
        available.tonCan.toFixed(1) +
        ' kg, đang xuất ' +
        requested.tongCay +
        ' cây / ' +
        requested.tongCan.toFixed(1) +
        ' kg.'
      );
    }
  }

  return null;
}

export function updateTtRemaining() {
  const el = document.getElementById('tt-remaining');
  const so = parseFloat(document.getElementById('tt-so-tien').value) || 0;
  if (so > 0) {
    el.style.display = 'block';
    el.style.background = '#e0f9f3';
    el.style.color = '#00886e';
    el.textContent = '✓ Ghi nhận thu: ' + fmtNum(so) + '₫';
  } else {
    el.style.display = 'none';
  }
}

/** Validate and prepare form submission with confirmation modal
 * @param {'nvm'|'vtp'|'xk'|'tt'|'kh'} type */
export function submitForm(type) {
  if (STATE.isSubmitting) return;
  const payload = buildPayload(type);
  if (!payload) return;
  // Auto-save draft trước khi confirm (phòng trường hợp mất mạng hoặc thoát tab)
  saveDraft(type, payload);
  const names = {
    nvm: 'lô vải mộc',
    vtp: 'vải thành phẩm',
    xk: 'phiếu xuất kho',
    tt: 'thanh toán',
    kh: 'khách hàng mới',
  };
  showConfirm(type, 'Xác nhận lưu ' + names[type], buildSummaryHtml(type, payload), payload);
}

/** Build the payload object for a given form type, or null if invalid */
export function buildPayload(type) {
  if (type === 'nvm') {
    const ngay = document.getElementById('nvm-ngay').value;
    const nhaDet = document.getElementById('nvm-det').value;
    const hang = document.getElementById('nvm-hang').value;
    if (!ngay || !nhaDet || !hang) {
      toast('Vui lòng điền đầy đủ các trường bắt buộc *', 'error');
      return null;
    }
    if (
      !STATE.nvm.rolls.some(function (r) {
        return parseFloat(r.kg) > 0;
      })
    ) {
      toast('Chưa nhập kg cho cây nào!', 'error');
      return null;
    }
    const kgs = STATE.nvm.rolls
      .map(function (r) {
        return parseFloat(r.kg) || 0;
      })
      .filter(function (k) {
        return k > 0;
      });
    const tongCan = kgs.reduce(function (a, b) {
      return a + b;
    }, 0);
    return {
      action: 'nhapVaiMoc',
      ngay: ngay,
      nhaDet: nhaDet,
      nhaNhuom: document.getElementById('nvm-nhuom').value,
      tenHang: hang,
      loaiMay: document.getElementById('nvm-may').value,
      tlMoc: document.getElementById('nvm-tlmoc').value,
      xe: document.getElementById('nvm-xe').value,
      giaDet: parseFloat(document.getElementById('nvm-gia-det').value) || 0,
      tongCan: +tongCan.toFixed(2),
      tongCay: kgs.length,
      kgs: kgs,
    };
  }
  if (type === 'vtp') {
    const ngay2 = document.getElementById('vtp-ngay').value;
    const nhuom = document.getElementById('vtp-nhuom').value;
    const hang2 = document.getElementById('vtp-hang').value;
    if (!ngay2 || !nhuom || !hang2) {
      toast('Vui lòng điền đầy đủ các trường bắt buộc *', 'error');
      return null;
    }
    if (
      !STATE.vtp.rolls.some(function (r) {
        return parseFloat(r.kg) > 0;
      })
    ) {
      toast('Chưa nhập kg cho cây nào!', 'error');
      return null;
    }
    const kgs2 = STATE.vtp.rolls
      .map(function (r) {
        return parseFloat(r.kg) || 0;
      })
      .filter(function (k) {
        return k > 0;
      });
    const tongCan2 = kgs2.reduce(function (a, b) {
      return a + b;
    }, 0);
    return {
      action: 'vaiThanhPham',
      ngay: ngay2,
      lotMoc: document.getElementById('vtp-lot-moc').value,
      nhaDet: document.getElementById('vtp-det').value,
      nhaNhuom: nhuom,
      tenHang: hang2,
      xe: document.getElementById('vtp-xe').value,
      giaNhuom: parseFloat(document.getElementById('vtp-gia-nhuom').value) || 0,
      tongCan: +tongCan2.toFixed(2),
      tongCay: kgs2.length,
      kgs: kgs2,
    };
  }
  if (type === 'xk') {
    saveActiveItemFromForm();
    const ngay3 = getVal('xk-ngay');
    const kh = getVal('xk-kh');
    if (!ngay3 || !kh) {
      toast('Vui lòng điền Ngày xuất và Khách hàng!', 'error');
      return null;
    }
    const hasAnyRoll = STATE.xk.items.some(function (item) {
      return item.rolls.some(function (r) {
        return parseFloat(r.kg) > 0;
      });
    });
    if (!hasAnyRoll) {
      toast('Chưa nhập kg cho cây nào!', 'error');
      return null;
    }
    const items = [];
    let tongCanAll = 0,
      tongCayAll = 0;
    let hasInvalidDonGia = false;
    STATE.xk.items.forEach(function (item) {
      if (hasInvalidDonGia) return;
      const kgsI = item.rolls
        .map(function (r) {
          return parseFloat(r.kg) || 0;
        })
        .filter(function (k) {
          return k > 0;
        });
      if (!kgsI.length && !item.hang) return;
        if (kgsI.length && !item.hang) {
          hasInvalidDonGia = true;
          toast('Mỗi mặt hàng có cây xuất phải chọn tên hàng!', 'error');
          return;
        }
      if (kgsI.length && (!item.donGia || item.donGia <= 0)) {
          hasInvalidDonGia = true;
        toast('Mỗi mặt hàng có cây xuất phải có đơn giá lớn hơn 0!', 'error');
        return;
      }
      const tc = kgsI.reduce(function (a, b) {
        return a + b;
      }, 0);
      tongCanAll += tc;
      tongCayAll += kgsI.length;
      items.push({
        tenHang: item.hang || '',
        donGia: item.donGia || 0,
        tongCan: +tc.toFixed(2),
        tongCay: kgsI.length,
        kgs: kgsI,
      });
    });
    if (hasInvalidDonGia) {
      return null;
    }
    if (!items.length) {
      toast('Chưa có mặt hàng nào có dữ liệu!', 'error');
      return null;
    }
    const stockIssue = getXkStockIssue(items);
    if (stockIssue) {
      toast(stockIssue, 'error');
      return null;
    }
    return {
      action: 'xuatKho',
      ngay: ngay3,
      khachHang: kh,
      xe: getVal('xk-xe'),
      trangThai: getVal('xk-tt') || 'Chưa thanh toán',
      ghiChu: getVal('xk-ghi-chu'),
      tongCan: +tongCanAll.toFixed(2),
      tongCay: tongCayAll,
      items: items,
    };
  }
  if (type === 'tt') {
    const khTt = document.getElementById('tt-kh').value;
    const so = document.getElementById('tt-so-tien').value;
    const ng = document.getElementById('tt-ngay').value;
    if (!khTt || !so || !ng) {
      toast('Vui lòng điền đầy đủ các trường bắt buộc *', 'error');
      return null;
    }
    return {
      action: 'thuTien',
      khachHang: khTt,
      soTien: parseFloat(so),
      ngay: ng,
      hinhThuc: document.getElementById('tt-hinh-thuc').value,
      ghiChu: document.getElementById('tt-ghi-chu').value,
    };
  }
  if (type === 'kh') {
    const ten = document.getElementById('kh-ten').value.trim();
    if (!ten) {
      toast('Vui lòng nhập tên khách hàng', 'error');
      return null;
    }
    return {
      action: 'themKH',
      ten: ten,
      ngay: document.getElementById('kh-ngay').value,
      phuTrach: document.getElementById('kh-phu-trach').value,
      sdt: document.getElementById('kh-sdt').value,
      email: document.getElementById('kh-email').value,
      diaChi: document.getElementById('kh-dia-chi').value,
      ghiChu: document.getElementById('kh-ghi-chu').value,
    };
  }
  return null;
}

export function buildSummaryHtml(type, p) {
  function row(k, v) {
    return (
      '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--muted)">' +
      escapeHtml(k) +
      '</span><strong>' +
      escapeHtml(v) +
      '</strong></div>'
    );
  }
  if (type === 'nvm')
    return [
      row('Nhà dệt', p.nhaDet),
      row('Tên hàng', p.tenHang),
      row('Ngày nhập', p.ngay),
      row('Giá dệt', fmtNum(p.giaDet) + '₫/kg'),
      row('Tổng cây', p.tongCay + ' cây'),
      row('Tổng cân', p.tongCan.toFixed(1) + ' kg'),
      row('Nợ dệt dự tính', fmtNum(Math.round(p.giaDet * p.tongCan)) + '₫'),
    ].join('');
  if (type === 'vtp')
    return [
      row('Lô mộc gốc', p.lotMoc || '—'),
      row('Nhà nhuộm', p.nhaNhuom),
      row('Tên hàng', p.tenHang),
      row('Ngày nhập TP', p.ngay),
      row('Giá nhuộm', fmtNum(p.giaNhuom) + '₫/kg'),
      row('Tổng cây', p.tongCay + ' cây'),
      row('Tổng cân TP', p.tongCan.toFixed(1) + ' kg'),
      row('Nợ nhuộm', fmtNum(Math.round(p.giaNhuom * p.tongCan)) + '₫'),
    ].join('');
  if (type === 'xk') {
    const lines = [
      row('Khách hàng', p.khachHang),
      row('Ngày xuất', p.ngay),
      row('Tổng cây', p.tongCay + ' cây'),
      row('Tổng cân', p.tongCan.toFixed(1) + ' kg'),
    ];
    (p.items || []).forEach(function (it, idx) {
      const tien = Math.round((it.donGia || 0) * (it.tongCan || 0));
      lines.push(
        row('Hàng ' + (idx + 1), (it.tenHang || '—') + ' · ' + fmtNum(it.donGia) + '₫/kg · ' + fmtNum(tien) + '₫'),
      );
    });
    lines.push(row('Thanh toán', p.trangThai));
    return lines.join('');
  }
  if (type === 'tt')
    return [
      row('Khách hàng', p.khachHang),
      row('Số tiền thu', fmtNum(p.soTien) + '₫'),
      row('Ngày thu', p.ngay),
      row('Hình thức', p.hinhThuc),
    ].join('');
  if (type === 'kh') return [row('Tên', p.ten), row('Ngày thêm', p.ngay), row('Phụ trách', p.phuTrach)].join('');
  return '';
}

export function showConfirm(type, title, body, payload) {
  safeText('confirm-title', title);
  safeHtml('confirm-body', '<div style="margin-bottom:4px">' + body + '</div>');
  document.getElementById('confirm-modal').style.display = 'flex';
  STATE.pendingAction = { type: type, payload: payload };
  const btn = document.getElementById('confirm-ok-btn');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = 'Xác nhận lưu';
    btn.onclick = function () {
      doSubmit(type, payload);
    };
  }
}

export function closeModal() {
  document.getElementById('confirm-modal').style.display = 'none';
  STATE.pendingAction = null;
}

/** Submit payload to Google Apps Script backend via POST */
export async function doSubmit(type, payload) {
  if (STATE.isSubmitting) return;
  const url = localStorage.getItem('vp_sheet_url');
  if (!url) {
    toast('⚙ Chưa cấu hình URL Google Apps Script!', 'error');
    showPage('cai-dat');
    return;
  }

  STATE.isSubmitting = true;
  const confirmBtn = document.getElementById('confirm-ok-btn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '⏳ Đang xử lý...';
  }

  const mainBtn = document.querySelector('.page.active .btn-success');
  const mainBtnHtml = mainBtn ? mainBtn.innerHTML : '';
  if (mainBtn) {
    mainBtn.disabled = true;
    mainBtn.innerHTML = '⏳ Đang lưu...';
  }

  toast('Đang lưu...', 'info');
  try {
    const cleanUrl = url.split('?')[0];
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error('GAS trả về không phải JSON: ' + rawText.substring(0, 100));
    }
    if (data.ok) {
      const msgs = {
        nhapVaiMoc: '✓ Lưu lô ' + data.lotId + ' — ' + data.tongCay + ' cây, ' + data.tongCan + 'kg',
        vaiThanhPham: '✓ Lưu VTP ' + data.id + ' — ' + data.tongCay + ' cây, ' + data.tongCan + 'kg',
        xuatKho: '✓ Lưu phiếu ' + data.id + ' — tổng ' + fmtNum(data.tongTien) + '₫',
        thuTien: '✓ Ghi nhận ' + fmtNum(payload.soTien) + '₫ từ ' + payload.khachHang,
        themKH: '✓ Thêm KH ' + data.id + ': ' + payload.ten,
      };
      toast(msgs[payload.action] || 'Lưu thành công!', 'success');
      if (payload.action === 'xuatKho') {
        confirmAndLockXkId();
        setTimeout(function () {
          updateXkId();
          renderPhieu();
        }, 100);
      }
      clearDraft(type); // xoá draft sau khi submit thành công
      resetForm(type);
      setTimeout(function () {
        syncFromSheets();
      }, 1500);
      if (type === 'kh') addKhToTable(data.id, payload.ten, payload.phuTrach);
    } else {
      toast('❌ Lỗi: ' + (data.msg || 'Không rõ'), 'error');
    }
  } catch (err) {
    if (!navigator.onLine) {
      // Mất mạng: lưu vào outbox để retry khi có mạng lại
      addToOutbox(payload).then(function () {
        toast('📥 Mất mạng — đã lưu vào hàng chờ, tự gửi khi có mạng lại.', 'warning');
      });
    } else {
      toast('❌ Lỗi hoặc không kết nối được Google Sheets. Kiểm tra URL và quyền.', 'error');
    }
    console.error(err);
  } finally {
    STATE.isSubmitting = false;
    closeModal();
    if (mainBtn) {
      mainBtn.disabled = false;
      mainBtn.innerHTML = mainBtnHtml;
    }
  }
}

/** Reset a form type to default values and re-render rolls */
export function resetForm(type) {
  const today = new Date().toISOString().split('T')[0];
  if (type === 'nvm') {
    ['nvm-det', 'nvm-nhuom', 'nvm-hang', 'nvm-xe'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    ['nvm-gia-det', 'nvm-may', 'nvm-tlmoc'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('nvm-ngay').value = today;
    STATE.nvm.rolls = Array.from({ length: DEFAULT_ROLLS }, function () {
      return { kg: '', w: '' };
    });
    renderRolls('nvm');
    updateNvmId();
  }
  if (type === 'vtp') {
    ['vtp-det', 'vtp-nhuom', 'vtp-hang', 'vtp-xe'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    ['vtp-gia-nhuom', 'vtp-lot-moc'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('vtp-ngay').value = today;
    STATE.vtp.rolls = Array.from({ length: DEFAULT_ROLLS }, function () {
      return { kg: '', w: '' };
    });
    renderRolls('vtp');
  }
  if (type === 'xk') {
    ['xk-kh', 'xk-xe', 'xk-ghi-chu'].forEach(function (id) {
      const e = document.getElementById(id);
      if (e) e.value = '';
    });
    const dte = document.getElementById('xk-ngay');
    if (dte) dte.value = today;
    const tte = document.getElementById('xk-tt');
    if (tte) tte.value = 'Chưa thanh toán';
    STATE.xk.items = [
      {
        hang: '',
        donGia: 0,
        rolls: Array.from({ length: DEFAULT_ROLLS }, function () {
          return { kg: '', w: '' };
        }),
      },
    ];
    setXkActive(0);
    STATE.xk.rolls = STATE.xk.items[0].rolls;
    renderXkTabs();
    syncItemFormToActive();
    renderRolls('xk');
    renderPhieu();
  }
  if (type === 'tt') {
    document.getElementById('tt-kh').value = '';
    document.getElementById('tt-so-tien').value = '';
    document.getElementById('tt-ghi-chu').value = '';
    document.getElementById('tt-ngay').value = today;
    document.getElementById('tt-hinh-thuc').value = 'Chuyển khoản';
    document.getElementById('tt-debt-info').style.display = 'none';
    document.getElementById('tt-remaining').style.display = 'none';
  }
  if (type === 'kh') {
    ['kh-ten', 'kh-sdt', 'kh-email', 'kh-dia-chi', 'kh-ghi-chu'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('kh-phu-trach').value = 'Vũ Tiến Lực';
    document.getElementById('kh-ngay').value = today;
  }
}

export function addKhToTable(id, ten, phuTrach) {
  const tbody = document.getElementById('kh-table-body');
  const tr = document.createElement('tr');
  tr.innerHTML =
    '<td>' +
    escapeHtml(String(id)) +
    '</td><td>' +
    escapeHtml(String(ten)) +
    '</td><td>' +
    escapeHtml(String(phuTrach)) +
    '</td>';
  tbody.appendChild(tr);
  STATE.khCount++;
  updateKhId();
}
