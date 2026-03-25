// ================================================================
// VĨNH PHÁT — Google Apps Script v2 (Realtime Sync)
// ================================================================

var SHEET_NAMES = {
  nhapVaiMoc: "Nhập vải mộc",
  vaiThanhPham: "Vải thành phẩm",
  phieuXuatKho: "Phiếu xuất kho",
  noKhach: "Nợ khách",
  noNhuom: "Nợ nhuộm",
  noDet: "Nợ dệt",
  danhMucKH: "Danh mục khách hàng",
  danhMucNCC: "Danh mục nhà cung cấp",
  danhMucVai: "Định mức",
};

// ── JSON response helper ──────────────────────────────────────
// Lưu ý: Apps Script không hỗ trợ setHeader() trên TextOutput
// CORS được xử lý tự động khi deploy với "Who has access: Anyone"
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ── doGet: đọc dữ liệu từ Sheets ─────────────────────────────
function doGet(e) {
  // Guard: e có thể undefined khi test trong editor
  var action = "ping";
  try {
    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }
  } catch (ignore) {}

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    switch (action) {
      case "ping":
        return json({ ok: true, msg: "Vĩnh Phát API v2 ✓", ts: Date.now() });
      case "getKH":
        return json({ ok: true, data: getKhachHang(ss) });
      case "getNCC":
        return json({ ok: true, data: getNCC(ss) });
      case "getNoKhach":
        return json({ ok: true, data: getNoKhach(ss) });
      case "getTonKho":
        return json({ ok: true, data: getTonKho(ss) });
      case "getSeq":
        return json({ ok: true, data: getAllSeq(ss) });
      case "getAll":
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
        return json({ ok: false, msg: "Unknown action: " + action });
    }
  } catch (err) {
    return json({ ok: false, msg: "doGet error: " + err.message });
  }
}

// ── doPost: ghi dữ liệu vào Sheets ───────────────────────────
function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return json({
      ok: false,
      msg: "Hệ thống đang bận xử lý yêu cầu khác, vui lòng thử lại.",
    });
  }
  try {
    if (!e || !e.postData)
      return json({ ok: false, msg: "No POST data received" });
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result;
    switch (data.action) {
      case "nhapVaiMoc":
        result = handleNhapVaiMoc(ss, data);
        break;
      case "vaiThanhPham":
        result = handleVaiTP(ss, data);
        break;
      case "xuatKho":
        result = handleXuatKho(ss, data);
        break;
      case "thuTien":
        result = handleThuTien(ss, data);
        break;
      case "themKH":
        result = handleThemKH(ss, data);
        break;
      default:
        result = { ok: false, msg: "Unknown action: " + data.action };
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
  while (s.length < len) s = "0" + s;
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
      return { id: r[0], ten: r[2], phuTrach: r[3] || "" };
    });
}

function getNCC(ss) {
  var rows = sheetRows(ss, SHEET_NAMES.danhMucNCC);
  return rows
    .filter(function (r) {
      return r[0] && r[2];
    })
    .map(function (r) {
      return { id: r[0], loai: r[1] || "", ten: r[2] };
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
      if (String(allData[i][j]).indexOf("KHÁCH HÀNG") !== -1) {
        startRow = i + 2;
        foundHeader = true;
        break;
      }
    }
    if (foundHeader) break;
  }

  var result = [];
  for (var r = startRow - 1; r < allData.length; r++) {
    var ten = String(allData[r][tenKHCol] || "").trim();
    if (!ten) continue;
    var tong = parseFloat(allData[r][tongCol]) || 0;
    var daTT = parseFloat(allData[r][daTTCol]) || 0;
    result.push({ ten: ten, tongNo: tong, daTT: daTT, conNo: tong - daTT });
  }
  return result;
}

function getTonKho(ss) {
  var ws = ss.getSheetByName(SHEET_NAMES.nhapVaiMoc);
  if (!ws || ws.getLastRow() < 2) return [];
  // Đọc cột: ID, tenHang, tongCay, tongCan
  var rows = ws.getRange(2, 1, ws.getLastRow() - 1, 12).getValues();
  var result = [];
  rows.forEach(function (r) {
    if (r[0])
      result.push({
        lotId: r[0],
        tenHang: r[4] || "",
        tongCay: r[11] || 0,
        tongCan: r[10] || 0,
      });
  });
  return result;
}

function getAllSeq(ss) {
  var seqs = {};
  [
    ["pxk", SHEET_NAMES.phieuXuatKho],
    ["nvm", SHEET_NAMES.nhapVaiMoc],
    ["vtp", SHEET_NAMES.vaiThanhPham],
    ["kh", SHEET_NAMES.danhMucKH],
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
  var lotId = "NVM-" + yr + "-" + pad(seq, 3);
  var kgs = d.kgs || [];
  var tongCan = 0;
  for (var i = 0; i < kgs.length; i++) tongCan += parseFloat(kgs[i]) || 0;
  tongCan = Math.round(tongCan * 100) / 100;
  var giaDet = parseFloat(d.giaDet) || 0;
  var row = [
    lotId,
    d.ngay || "",
    d.nhaDet || "",
    d.nhaNhuom || "",
    d.tenHang || "",
    d.loaiMay || "",
    d.tlMoc || "",
    d.xe || "",
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
  var id = "NVTP-" + yr + "-" + pad(seq, 3);
  var kgs = d.kgs || [];
  var tongCan = 0;
  for (var i = 0; i < kgs.length; i++) tongCan += parseFloat(kgs[i]) || 0;
  tongCan = Math.round(tongCan * 100) / 100;
  var giaNhuom = parseFloat(d.giaNhuom) || 0;
  var row = [
    id,
    d.ngay || "",
    d.lotMoc || "",
    d.nhaDet || "",
    d.nhaNhuom || "",
    d.tenHang || "",
    d.xe || "",
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
  var id = "PXK-VTP-" + pad(seq, 3);
  var items = d.items || [];
  // Tương thích ngược: nếu không có items[], dùng d.kgs trực tiếp
  if (!items.length && d.kgs) {
    items = [
      {
        tenHang: d.tenHang || "",
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
      d.ngay || "",
      "Xuat kho",
      d.khachHang || "",
      item.tenHang || "",
      d.xe || "",
      d.trangThai || "Chua thanh toan",
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
      while (rowsToInsert[l].length < maxCols) rowsToInsert[l].push("");
    }
    var lastRow = Math.max(ws.getLastRow(), 1);
    ws.getRange(lastRow + 1, 1, rowsToInsert.length, maxCols).setValues(
      rowsToInsert,
    );
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
  if (last < 2) return { ok: false, msg: "Sheet No khach chua co du lieu" };
  var allData = ws.getRange(1, 1, last, ws.getLastColumn()).getValues();
  var tenKHCol = 2,
    daTTCol = 7,
    startRow = 2;
  var foundHeader = false;
  for (var i = 0; i < allData.length; i++) {
    for (var j = 0; j < allData[i].length; j++) {
      if (String(allData[i][j]).indexOf("KHÁCH HÀNG") !== -1) {
        startRow = i + 2;
        foundHeader = true;
        break;
      }
    }
    if (foundHeader) break;
  }
  var foundRow = -1;
  for (var r = startRow - 1; r < allData.length; r++)
    if (String(allData[r][tenKHCol] || "").trim() === d.khachHang.trim()) {
      foundRow = r + 1;
      break;
    }
  if (foundRow === -1) {
    var newRow = [
      "",
      "",
      d.khachHang,
      "",
      "",
      "",
      "",
      parseFloat(d.soTien) || 0,
      "",
      "",
    ];
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
  var id = "KH-" + pad(seq, 3);
  ws.appendRow([
    id,
    d.ngay || "",
    d.ten || "",
    d.phuTrach || "Vu Tien Luc",
    "",
    "",
    "",
  ]);
  return { ok: true, id: id, ten: d.ten };
}
