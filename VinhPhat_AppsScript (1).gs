var SHEET_NAMES = {
  nhapVaiMoc:   'Nhập vải mộc',
  vaiThanhPham: 'Vải thành phẩm',
  phieuXuatKho: 'Phiếu xuất kho',
  noKhach:      'Nợ khách',
  danhMucKH:    'Danh mục khách hàng'
};

function doGet(e) {
  return json({ ok: true, msg: 'Vinh Phat API san sang' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var result;
    if      (data.action === 'nhapVaiMoc')   result = handleNhapVaiMoc(ss, data);
    else if (data.action === 'vaiThanhPham') result = handleVaiTP(ss, data);
    else if (data.action === 'xuatKho')      result = handleXuatKho(ss, data);
    else if (data.action === 'thuTien')      result = handleThuTien(ss, data);
    else if (data.action === 'themKH')       result = handleThemKH(ss, data);
    else result = { ok: false, msg: 'Action khong hop le: ' + data.action };
    return json(result);
  } catch (err) {
    return json({ ok: false, msg: err.message });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function nextSeq(ws) {
  var last = ws.getLastRow();
  if (last < 2) return 1;
  var vals = ws.getRange(2, 1, last - 1, 1).getValues();
  var max  = 0;
  for (var i = 0; i < vals.length; i++) {
    var v = String(vals[i][0]);
    var m = v.match(/(\d+)$/);
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

function handleNhapVaiMoc(ss, d) {
  var ws     = ss.getSheetByName(SHEET_NAMES.nhapVaiMoc);
  var seq    = nextSeq(ws);
  var yr     = new Date().getFullYear();
  var lotId  = 'NVM-' + yr + '-' + pad(seq, 3);
  var kgs    = d.kgs || [];
  var tongCan = 0;
  for (var i = 0; i < kgs.length; i++) {
    tongCan += parseFloat(kgs[i]) || 0;
  }
  tongCan = Math.round(tongCan * 100) / 100;
  var giaDet  = parseFloat(d.giaDet) || 0;
  var noDet   = Math.round(giaDet * tongCan);
  var tongCay = kgs.length;
  var row = [
    lotId, d.ngay || '', d.nhaDet || '', d.nhaNhuom || '',
    d.tenHang || '', d.loaiMay || '', d.tlMoc || '', d.xe || '',
    noDet, giaDet, tongCan, tongCay
  ];
  for (var j = 0; j < kgs.length; j++) {
    row.push(parseFloat(kgs[j]) || 0);
  }
  ws.appendRow(row);
  return { ok: true, lotId: lotId, tongCay: tongCay, tongCan: tongCan, noDet: noDet };
}

function handleVaiTP(ss, d) {
  var ws      = ss.getSheetByName(SHEET_NAMES.vaiThanhPham);
  var seq     = nextSeq(ws);
  var yr      = new Date().getFullYear();
  var id      = 'NVTP-' + yr + '-' + pad(seq, 3);
  var kgs     = d.kgs || [];
  var tongCan = 0;
  for (var i = 0; i < kgs.length; i++) {
    tongCan += parseFloat(kgs[i]) || 0;
  }
  tongCan = Math.round(tongCan * 100) / 100;
  var giaNhuom = parseFloat(d.giaNhuom) || 0;
  var noNhuom  = Math.round(giaNhuom * tongCan);
  var tongCay  = kgs.length;
  var row = [
    id, d.ngay || '', d.nhaDet || '', d.nhaNhuom || '',
    d.tenHang || '', d.xe || '', noNhuom, giaNhuom, tongCan, tongCay
  ];
  for (var j = 0; j < kgs.length; j++) {
    row.push(parseFloat(kgs[j]) || 0);
  }
  ws.appendRow(row);
  return { ok: true, id: id, tongCay: tongCay, tongCan: tongCan, noNhuom: noNhuom };
}

function handleXuatKho(ss, d) {
  var ws      = ss.getSheetByName(SHEET_NAMES.phieuXuatKho);
  var seq     = nextSeq(ws);
  var id      = 'PXK-VTP-' + pad(seq, 3);
  var kgs     = d.kgs || [];
  var tongCan = 0;
  for (var i = 0; i < kgs.length; i++) {
    tongCan += parseFloat(kgs[i]) || 0;
  }
  tongCan = Math.round(tongCan * 100) / 100;
  var donGia   = parseFloat(d.donGia) || 0;
  var tongTien = Math.round(donGia * tongCan);
  var tongCay  = kgs.length;
  var row = [
    id, d.ngay || '', 'Xuat kho', d.khachHang || '',
    d.tenHang || '', d.xe || '', d.trangThai || 'Chua thanh toan',
    tongTien, donGia, tongCan, tongCay
  ];
  for (var j = 0; j < kgs.length; j++) {
    row.push(parseFloat(kgs[j]) || 0);
  }
  ws.appendRow(row);
  return { ok: true, id: id, tongTien: tongTien, tongCay: tongCay, tongCan: tongCan };
}

function handleThuTien(ss, d) {
  var ws   = ss.getSheetByName(SHEET_NAMES.noKhach);
  var last = ws.getLastRow();
  if (last < 2) return { ok: false, msg: 'Sheet No khach chua co du lieu' };
  var allData  = ws.getRange(1, 1, last, ws.getLastColumn()).getValues();
  var tenKHCol = 2;
  var daTTCol  = 7;
  var startRow = 2;
  for (var i = 0; i < allData.length; i++) {
    for (var j = 0; j < allData[i].length; j++) {
      var cellVal = String(allData[i][j]);
      if (cellVal.indexOf('KHÁCH HÀNG') !== -1 || cellVal.indexOf('Tên khách') !== -1) {
        startRow = i + 2;
      }
    }
  }
  var foundRow = -1;
  for (var r = startRow - 1; r < allData.length; r++) {
    var ten = String(allData[r][tenKHCol] || '').trim();
    if (ten === d.khachHang.trim()) {
      foundRow = r + 1;
      break;
    }
  }
  if (foundRow === -1) {
    var newRow = ['', '', d.khachHang, '', '', '', '', parseFloat(d.soTien) || 0, '', ''];
    ws.appendRow(newRow);
    return { ok: true, khachHang: d.khachHang, daTT: parseFloat(d.soTien) || 0 };
  }
  var cell   = ws.getRange(foundRow, daTTCol + 1);
  var oldVal = parseFloat(cell.getValue()) || 0;
  var newVal = oldVal + (parseFloat(d.soTien) || 0);
  cell.setValue(newVal);
  return { ok: true, khachHang: d.khachHang, soTienThu: parseFloat(d.soTien) || 0, daTT: newVal };
}

function handleThemKH(ss, d) {
  var ws  = ss.getSheetByName(SHEET_NAMES.danhMucKH);
  var seq = nextSeq(ws);
  var id  = 'KH-' + pad(seq, 3);
  ws.appendRow([id, d.ngay || '', d.ten || '', d.phuTrach || 'Vu Tien Luc', '', '', '']);
  return { ok: true, id: id, ten: d.ten };
}
