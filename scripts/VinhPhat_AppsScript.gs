// ================================================================
// VĨNH PHÁT — Google Apps Script v2 (Realtime Sync)
// ================================================================

var SHEET_NAMES = {
  nhapVaiMoc: 'Nhập vải mộc',
  vaiThanhPham: 'Vải thành phẩm',
  phieuXuatKho: 'Phiếu xuất kho',
  noKhach: 'Nợ khách',
  noNhuom: 'Nợ nhuộm',
  noDet: 'Nợ dệt',
  danhMucKH: 'Danh mục khách hàng',
  danhMucNCC: 'Danh mục nhà cung cấp',
  danhMucVai: 'Định mức',
};

// ── JSON response helper ──────────────────────────────────────
// Lưu ý: Apps Script không hỗ trợ setHeader() trên TextOutput
// CORS được xử lý tự động khi deploy với "Who has access: Anyone"
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ── doGet: đọc dữ liệu từ Sheets ─────────────────────────────
function doGet(e) {
  // Guard: e có thể undefined khi test trong editor
  var action = 'ping';
  try {
    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }
  } catch (ignore) {}

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    switch (action) {
      case 'ping':
        return json({ ok: true, msg: 'Vĩnh Phát API v2 ✓', ts: Date.now() });
      case 'getKH':
        return json({ ok: true, data: getKhachHang(ss) });
      case 'getNCC':
        return json({ ok: true, data: getNCC(ss) });
      case 'getNoKhach':
        return json({ ok: true, data: getNoKhach(ss) });
      case 'getTonKho':
        return json({ ok: true, data: getTonKho(ss) });
      case 'getSeq':
        return json({ ok: true, data: getAllSeq(ss) });
      case 'getHistory':
        return json({ ok: true, rows: getHistory(ss, e ? e.parameter : {}) });
      case 'getReport':
        return json({ ok: true, data: getReport(ss, e ? e.parameter : {}) });
      case 'getAll':
        return json({
          ok: true,
          ts: Date.now(),
          khachHang: getKhachHang(ss),
          ncc: getNCC(ss),
          noKhach: getNoKhach(ss),
          tonKho: getTonKho(ss),
          seq: getAllSeq(ss),
        });
      default:
        return json({ ok: false, msg: 'Unknown action: ' + action });
    }
  } catch (err) {
    return json({ ok: false, msg: 'doGet error: ' + err.message });
  }
}

// ── doPost: ghi dữ liệu vào Sheets ───────────────────────────
function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return json({
      ok: false,
      msg: 'Hệ thống đang bận xử lý yêu cầu khác, vui lòng thử lại.',
    });
  }
  try {
    if (!e || !e.postData) return json({ ok: false, msg: 'No POST data received' });
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result;
    switch (data.action) {
      case 'nhapVaiMoc':
        result = handleNhapVaiMoc(ss, data);
        break;
      case 'vaiThanhPham':
        result = handleVaiTP(ss, data);
        break;
      case 'xuatKho':
        result = handleXuatKho(ss, data);
        break;
      case 'thuTien':
        result = handleThuTien(ss, data);
        break;
      case 'themKH':
        result = handleThemKH(ss, data);
        break;
      default:
        result = { ok: false, msg: 'Unknown action: ' + data.action };
    }
    return json(result);
  } catch (err) {
    return json({ ok: false, msg: err.message });
  } finally {
    lock.releaseLock();
  }
}

// ── Helpers ───────────────────────────────────────────────────
function nextSeq(ws) {
  var last = ws.getLastRow();
  if (last < 2) return 1;
  var vals = ws.getRange(2, 1, last - 1, 1).getValues();
  var max = 0;
  for (var i = 0; i < vals.length; i++) {
    var m = String(vals[i][0]).match(/(\d+)$/);
    if (m) {
      var n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

function pad(n, len) {
  var s = String(n);
  while (s.length < len) s = '0' + s;
  return s;
}

function sheetRows(ss, name) {
  var ws = ss.getSheetByName(name);
  if (!ws || ws.getLastRow() < 2) return [];
  return ws.getRange(2, 1, ws.getLastRow() - 1, ws.getLastColumn()).getValues();
}

// ── GET handlers ─────────────────────────────────────────────
function getKhachHang(ss) {
  var rows = sheetRows(ss, SHEET_NAMES.danhMucKH);
  return rows
    .filter(function (r) {
      return r[0] && r[2];
    })
    .map(function (r) {
      return { id: r[0], ten: r[2], phuTrach: r[3] || '' };
    });
}

function getNCC(ss) {
  var rows = sheetRows(ss, SHEET_NAMES.danhMucNCC);
  return rows
    .filter(function (r) {
      return r[0] && r[2];
    })
    .map(function (r) {
      return { id: r[0], loai: r[1] || '', ten: r[2] };
    });
}

function getNoKhach(ss) {
  var ws = ss.getSheetByName(SHEET_NAMES.noKhach);
  var last = ws.getLastRow();
  if (!ws || last < 2) return [];
  var allData = ws.getRange(1, 1, last, ws.getLastColumn()).getValues();

  var tenKHCol = 2,
    tongCol = 5,
    daTTCol = 7,
    startRow = 2;
  var foundHeader = false;
  for (var i = 0; i < allData.length; i++) {
    for (var j = 0; j < allData[i].length; j++) {
      if (String(allData[i][j]).indexOf('KHÁCH HÀNG') !== -1) {
        startRow = i + 2;
        foundHeader = true;
        break;
      }
    }
    if (foundHeader) break;
  }

  var result = [];
  for (var r = startRow - 1; r < allData.length; r++) {
    var ten = String(allData[r][tenKHCol] || '').trim();
    if (!ten) continue;
    var tong = parseFloat(allData[r][tongCol]) || 0;
    var daTT = parseFloat(allData[r][daTTCol]) || 0;
    result.push({ ten: ten, tongNo: tong, daTT: daTT, conNo: tong - daTT });
  }
  return result;
}

function getTonKho(ss) {
  // ── Tồn vải mộc: NVM gom theo tenHang ──────────────────────
  // Cột NVM: [0]=ID,[1]=ngay,[2]=nhaDet,[3]=nhaNhuom,[4]=tenHang,
  //          [9]=giaDet,[10]=tongCan,[11]=tongCay
  var nvmMap = {};
  sheetRows(ss, SHEET_NAMES.nhapVaiMoc).forEach(function (r) {
    if (!r[0]) return;
    var h = String(r[4] || '').trim();
    if (!h) return;
    if (!nvmMap[h]) nvmMap[h] = { tenHang: h, tongCay: 0, tongCan: 0 };
    nvmMap[h].tongCay += parseInt(r[11]) || 0;
    nvmMap[h].tongCan += parseFloat(r[10]) || 0;
  });

  // ── Tồn vải TP: VTP − XK gom theo tenHang ──────────────────
  // Cột VTP: [0]=ID,[1]=ngay,[2]=lotMoc,[3]=nhaDet,[4]=nhaNhuom,
  //          [5]=tenHang,[9]=tongCan,[10]=tongCay
  // Cột XK:  [0]=ID,[1]=ngay,[2]=type,[3]=khachHang,[4]=tenHang,
  //          [9]=tongCan,[10]=tongCay
  var vtpMap = {};
  sheetRows(ss, SHEET_NAMES.vaiThanhPham).forEach(function (r) {
    if (!r[0]) return;
    var h = String(r[5] || '').trim();
    if (!h) return;
    if (!vtpMap[h]) vtpMap[h] = { tenHang: h, nhapCay: 0, nhapCan: 0, xuatCay: 0, xuatCan: 0 };
    vtpMap[h].nhapCay += parseInt(r[10]) || 0;
    vtpMap[h].nhapCan += parseFloat(r[9]) || 0;
  });
  sheetRows(ss, SHEET_NAMES.phieuXuatKho).forEach(function (r) {
    if (!r[0]) return;
    var h = String(r[4] || '').trim();
    if (!h) return;
    if (!vtpMap[h]) vtpMap[h] = { tenHang: h, nhapCay: 0, nhapCan: 0, xuatCay: 0, xuatCan: 0 };
    vtpMap[h].xuatCay += parseInt(r[10]) || 0;
    vtpMap[h].xuatCan += parseFloat(r[9]) || 0;
  });

  var nvmList = Object.keys(nvmMap).map(function (k) {
    var v = nvmMap[k];
    return {
      tenHang: v.tenHang,
      tongCay: v.tongCay,
      tongCan: Math.round(v.tongCan * 100) / 100,
    };
  });

  var vtpList = Object.keys(vtpMap).map(function (k) {
    var v = vtpMap[k];
    return {
      tenHang: v.tenHang,
      nhapCay: v.nhapCay,
      nhapCan: Math.round(v.nhapCan * 100) / 100,
      xuatCay: v.xuatCay,
      xuatCan: Math.round(v.xuatCan * 100) / 100,
      tonCay: v.nhapCay - v.xuatCay,
      tonCan: Math.round((v.nhapCan - v.xuatCan) * 100) / 100,
    };
  });

  return { nvm: nvmList, vtp: vtpList };
}

function getHistory(ss, params) {
  var type = (params && params.type) || 'all';
  var from = (params && params.from) || '';
  var to = (params && params.to) || '';
  var result = [];

  function inRange(ngay) {
    if (!from && !to) return true;
    var s = String(ngay).substring(0, 10);
    if (from && s < from) return false;
    if (to && s > to) return false;
    return true;
  }

  if (type === 'all' || type === 'nvm') {
    var nvmRows = sheetRows(ss, SHEET_NAMES.nhapVaiMoc);
    nvmRows.forEach(function (r) {
      if (!r[0] || !inRange(r[1])) return;
      result.push({
        id: r[0],
        type: 'nvm',
        ngay: fmtNgay(r[1]),
        nhaDet: r[2] || '',
        nhaNhuom: r[3] || '',
        tenHang: r[4] || '',
        tongCan: parseFloat(r[10]) || 0,
        tongCay: parseInt(r[11]) || 0,
        tien: Math.round((parseFloat(r[9]) || 0) * (parseFloat(r[10]) || 0)),
      });
    });
  }

  if (type === 'all' || type === 'vtp') {
    var vtpRows = sheetRows(ss, SHEET_NAMES.vaiThanhPham);
    vtpRows.forEach(function (r) {
      if (!r[0] || !inRange(r[1])) return;
      result.push({
        id: r[0],
        type: 'vtp',
        ngay: fmtNgay(r[1]),
        nhaDet: r[3] || '',
        nhaNhuom: r[4] || '',
        tenHang: r[5] || '',
        tongCan: parseFloat(r[9]) || 0,
        tongCay: parseInt(r[10]) || 0,
        tien: Math.round((parseFloat(r[8]) || 0) * (parseFloat(r[9]) || 0)),
      });
    });
  }

  if (type === 'all' || type === 'xk') {
    var xkRows = sheetRows(ss, SHEET_NAMES.phieuXuatKho);
    // Gộp các dòng cùng ID thành 1 record
    var xkMap = {};
    xkRows.forEach(function (r) {
      if (!r[0] || !inRange(r[1])) return;
      var id = String(r[0]);
      if (!xkMap[id]) {
        xkMap[id] = {
          id: id,
          type: 'xk',
          ngay: fmtNgay(r[1]),
          khachHang: r[3] || '',
          tenHang: r[4] || '',
          trangThai: r[6] || '',
          tien: 0,
          tongCan: 0,
          tongCay: 0,
        };
      }
      xkMap[id].tien += parseFloat(r[7]) || 0;
      xkMap[id].tongCan += parseFloat(r[9]) || 0;
      xkMap[id].tongCay += parseInt(r[10]) || 0;
    });
    Object.keys(xkMap).forEach(function (k) {
      result.push(xkMap[k]);
    });
  }

  // Sắp xếp mới nhất lên đầu
  result.sort(function (a, b) {
    return b.ngay > a.ngay ? 1 : -1;
  });
  return result;
}

function getReport(ss, params) {
  var period = (params && params.period) || 'month';
  var year = String((params && params.year) || new Date().getFullYear());

  function periodKey(ngay) {
    var m = parseInt(String(ngay).substring(5, 7));
    if (period === 'quarter') {
      return year + '-Q' + Math.ceil(m / 3);
    }
    return String(ngay).substring(0, 7);
  }

  // Doanh thu từ XK (cột[7]=tiền từng dòng)
  var dtMap = {};
  sheetRows(ss, SHEET_NAMES.phieuXuatKho).forEach(function (r) {
    if (!r[0]) return;
    var ngay = fmtNgay(r[1]);
    if (!ngay || ngay.substring(0, 4) !== year) return;
    var key = periodKey(ngay);
    dtMap[key] = (dtMap[key] || 0) + (parseFloat(r[7]) || 0);
  });

  // Sản lượng từ VTP (cột[10]=tổng cây)
  var slMap = {};
  sheetRows(ss, SHEET_NAMES.vaiThanhPham).forEach(function (r) {
    if (!r[0]) return;
    var ngay = fmtNgay(r[1]);
    if (!ngay || ngay.substring(0, 4) !== year) return;
    var key = periodKey(ngay);
    slMap[key] = (slMap[key] || 0) + (parseInt(r[10]) || 0);
  });

  function toSortedArray(m) {
    return Object.keys(m)
      .sort()
      .map(function (k) {
        return { label: k, value: m[k] };
      });
  }

  return {
    year: year,
    period: period,
    doanhThu: toSortedArray(dtMap),
    sanLuong: toSortedArray(slMap),
    noKhach: getNoKhach(ss),
  };
}

function fmtNgay(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = val.getMonth() + 1;
    var d = val.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }
  return String(val).substring(0, 10);
}

function getAllSeq(ss) {
  var seqs = {};
  [
    ['pxk', SHEET_NAMES.phieuXuatKho],
    ['nvm', SHEET_NAMES.nhapVaiMoc],
    ['vtp', SHEET_NAMES.vaiThanhPham],
    ['kh', SHEET_NAMES.danhMucKH],
  ].forEach(function (pair) {
    var ws = ss.getSheetByName(pair[1]);
    seqs[pair[0]] = ws ? nextSeq(ws) : 1;
  });
  return seqs;
}

// ── POST handlers ─────────────────────────────────────────────
function handleNhapVaiMoc(ss, d) {
  var ws = ss.getSheetByName(SHEET_NAMES.nhapVaiMoc);
  var seq = nextSeq(ws);
  var yr = new Date().getFullYear();
  var lotId = 'NVM-' + yr + '-' + pad(seq, 3);
  var kgs = d.kgs || [];
  var tongCan = 0;
  for (var i = 0; i < kgs.length; i++) tongCan += parseFloat(kgs[i]) || 0;
  tongCan = Math.round(tongCan * 100) / 100;
  var giaDet = parseFloat(d.giaDet) || 0;
  var row = [
    lotId,
    d.ngay || '',
    d.nhaDet || '',
    d.nhaNhuom || '',
    d.tenHang || '',
    d.loaiMay || '',
    d.tlMoc || '',
    d.xe || '',
    Math.round(giaDet * tongCan),
    giaDet,
    tongCan,
    kgs.length,
  ];
  for (var j = 0; j < kgs.length; j++) row.push(parseFloat(kgs[j]) || 0);
  ws.appendRow(row);
  return { ok: true, lotId: lotId, tongCay: kgs.length, tongCan: tongCan };
}

function handleVaiTP(ss, d) {
  var ws = ss.getSheetByName(SHEET_NAMES.vaiThanhPham);
  var seq = nextSeq(ws);
  var yr = new Date().getFullYear();
  var id = 'NVTP-' + yr + '-' + pad(seq, 3);
  var kgs = d.kgs || [];
  var tongCan = 0;
  for (var i = 0; i < kgs.length; i++) tongCan += parseFloat(kgs[i]) || 0;
  tongCan = Math.round(tongCan * 100) / 100;
  var giaNhuom = parseFloat(d.giaNhuom) || 0;
  var row = [
    id,
    d.ngay || '',
    d.lotMoc || '',
    d.nhaDet || '',
    d.nhaNhuom || '',
    d.tenHang || '',
    d.xe || '',
    Math.round(giaNhuom * tongCan),
    giaNhuom,
    tongCan,
    kgs.length,
  ];
  for (var j = 0; j < kgs.length; j++) row.push(parseFloat(kgs[j]) || 0);
  ws.appendRow(row);
  return { ok: true, id: id, tongCay: kgs.length, tongCan: tongCan };
}

function handleXuatKho(ss, d) {
  var ws = ss.getSheetByName(SHEET_NAMES.phieuXuatKho);
  var seq = nextSeq(ws);
  var id = 'PXK-VTP-' + pad(seq, 3);
  var items = d.items || [];
  // Tương thích ngược: nếu không có items[], dùng d.kgs trực tiếp
  if (!items.length && d.kgs) {
    items = [
      {
        tenHang: d.tenHang || '',
        donGia: parseFloat(d.donGia) || 0,
        kgs: d.kgs,
      },
    ];
  }
  var tongTien = 0,
    tongCanAll = 0,
    tongCayAll = 0;
  var rowsToInsert = [];
  items.forEach(function (item) {
    var kgs = item.kgs || [];
    if (!kgs.length && !item.tenHang) return; // Bỏ qua item rỗng
    var tongCan = 0;
    for (var i = 0; i < kgs.length; i++) tongCan += parseFloat(kgs[i]) || 0;
    tongCan = Math.round(tongCan * 100) / 100;
    var donGia = parseFloat(item.donGia) || 0;
    var tien = Math.round(donGia * tongCan);
    tongTien += tien;
    tongCanAll += tongCan;
    tongCayAll += kgs.length;
    var row = [
      id,
      d.ngay || '',
      'Xuat kho',
      d.khachHang || '',
      item.tenHang || '',
      d.xe || '',
      d.trangThai || 'Chua thanh toan',
      tien,
      donGia,
      tongCan,
      kgs.length,
    ];
    for (var j = 0; j < kgs.length; j++) row.push(parseFloat(kgs[j]) || 0);
    rowsToInsert.push(row);
  });

  if (rowsToInsert.length > 0) {
    // Tìm độ dài hàng lớn nhất
    var maxCols = 0;
    for (var k = 0; k < rowsToInsert.length; k++) {
      if (rowsToInsert[k].length > maxCols) maxCols = rowsToInsert[k].length;
    }
    // Cân bằng số cột cho mảng vuông
    for (var l = 0; l < rowsToInsert.length; l++) {
      while (rowsToInsert[l].length < maxCols) rowsToInsert[l].push('');
    }
    var lastRow = Math.max(ws.getLastRow(), 1);
    ws.getRange(lastRow + 1, 1, rowsToInsert.length, maxCols).setValues(rowsToInsert);
  }
  return {
    ok: true,
    id: id,
    tongTien: tongTien,
    tongCay: tongCayAll,
    tongCan: tongCanAll,
  };
}

function handleThuTien(ss, d) {
  var ws = ss.getSheetByName(SHEET_NAMES.noKhach);
  var last = ws.getLastRow();
  if (last < 2) return { ok: false, msg: 'Sheet No khach chua co du lieu' };
  var allData = ws.getRange(1, 1, last, ws.getLastColumn()).getValues();
  var tenKHCol = 2,
    daTTCol = 7,
    startRow = 2;
  var foundHeader = false;
  for (var i = 0; i < allData.length; i++) {
    for (var j = 0; j < allData[i].length; j++) {
      if (String(allData[i][j]).indexOf('KHÁCH HÀNG') !== -1) {
        startRow = i + 2;
        foundHeader = true;
        break;
      }
    }
    if (foundHeader) break;
  }
  var foundRow = -1;
  for (var r = startRow - 1; r < allData.length; r++)
    if (String(allData[r][tenKHCol] || '').trim() === d.khachHang.trim()) {
      foundRow = r + 1;
      break;
    }
  if (foundRow === -1) {
    var newRow = ['', '', d.khachHang, '', '', '', '', parseFloat(d.soTien) || 0, '', ''];
    ws.appendRow(newRow);
    return {
      ok: true,
      khachHang: d.khachHang,
      daTT: parseFloat(d.soTien) || 0,
    };
  }
  var cell = ws.getRange(foundRow, daTTCol + 1);
  var newVal = (parseFloat(cell.getValue()) || 0) + (parseFloat(d.soTien) || 0);
  cell.setValue(newVal);
  return { ok: true, khachHang: d.khachHang, daTT: newVal };
}

function handleThemKH(ss, d) {
  var ws = ss.getSheetByName(SHEET_NAMES.danhMucKH);
  var seq = nextSeq(ws);
  var id = 'KH-' + pad(seq, 3);
  ws.appendRow([id, d.ngay || '', d.ten || '', d.phuTrach || 'Vu Tien Luc', '', '', '']);
  return { ok: true, id: id, ten: d.ten };
}
