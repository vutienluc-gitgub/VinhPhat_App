// ══ BAOCAO — Trang báo cáo & biểu đồ ══

import { escapeHtml, fmtNum, toast } from './utils.js';

/** Chart instances — destroy trước khi re-render */
let _chartDT = null;
let _chartSL = null;

/** Khởi tạo sự kiện cho trang Báo cáo */
export function initBaoCao() {
  const btnLoad = document.getElementById('baocao-btn-load');
  const btnPrint = document.getElementById('baocao-btn-print');
  if (btnLoad) btnLoad.addEventListener('click', loadBaoCao);
  if (btnPrint) btnPrint.addEventListener('click', printBaoCao);
}

/** Fetch báo cáo từ GAS theo năm + kỳ đã chọn */
export async function loadBaoCao() {
  const url = localStorage.getItem('vp_sheet_url');
  if (!url) {
    toast('⚙ Chưa cấu hình URL Google Apps Script!', 'error');
    return;
  }
  const yearEl = document.getElementById('baocao-year');
  const periodEl = document.getElementById('baocao-period');
  const year = (yearEl && yearEl.value) || new Date().getFullYear();
  const period = (periodEl && periodEl.value) || 'month';

  setBaoCaoLoading(true);
  try {
    const fetchUrl =
      url.split('?')[0] +
      '?action=getReport&year=' +
      year +
      '&period=' +
      period +
      '&_t=' +
      Date.now();
    const res = await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Phản hồi không phải JSON');
    }
    if (!data.ok) throw new Error(data.msg || 'Fetch failed');
    renderBaoCao(data.data);
  } catch (err) {
    toast('Lỗi tải báo cáo: ' + err.message, 'error');
    setBaoCaoLoading(false);
  }
}

/** Render toàn bộ trang báo cáo */
export function renderBaoCao(data) {
  setBaoCaoLoading(false);
  const dtList = (data && data.doanhThu) || [];
  const slList = (data && data.sanLuong) || [];
  const noList = (data && data.noKhach) || [];

  renderDoanhThuChart(dtList);
  renderSanLuongChart(slList);
  renderNoKhachTable(noList);

  // Cập nhật summary tổng
  const totalDT = dtList.reduce(function (s, d) { return s + d.value; }, 0);
  const totalSL = slList.reduce(function (s, d) { return s + d.value; }, 0);
  const totalNo = noList.reduce(function (s, r) { return s + (r.conNo > 0 ? r.conNo : 0); }, 0);

  const elDT = document.getElementById('baocao-sum-dt');
  const elSL = document.getElementById('baocao-sum-sl');
  const elNo = document.getElementById('baocao-sum-no');
  if (elDT) elDT.textContent = fmtNum(Math.round(totalDT)) + ' đ';
  if (elSL) elSL.textContent = fmtNum(totalSL) + ' cây';
  if (elNo) elNo.textContent = fmtNum(Math.round(totalNo)) + ' đ';

  const content = document.getElementById('baocao-content');
  if (content) content.style.display = 'block';
}

/** Biểu đồ doanh thu theo kỳ */
function renderDoanhThuChart(list) {
  const canvas = document.getElementById('chart-doanh-thu');
  if (!canvas || !window.Chart) return;
  if (_chartDT) {
    _chartDT.destroy();
    _chartDT = null;
  }
  const labels = list.map(function (d) { return d.label; });
  const values = list.map(function (d) { return d.value; });

  _chartDT = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Doanh thu',
          data: values,
          backgroundColor: 'rgba(0, 68, 136, 0.72)',
          borderColor: '#004488',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ' ' + fmtNum(Math.round(ctx.raw)) + ' đ';
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (val) {
              if (val >= 1000000) return (val / 1000000).toFixed(0) + 'M';
              if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
              return val;
            },
          },
        },
      },
    },
  });
}

/** Biểu đồ sản lượng (cây TP) theo kỳ */
function renderSanLuongChart(list) {
  const canvas = document.getElementById('chart-san-luong');
  if (!canvas || !window.Chart) return;
  if (_chartSL) {
    _chartSL.destroy();
    _chartSL = null;
  }
  const labels = list.map(function (d) { return d.label; });
  const values = list.map(function (d) { return d.value; });

  _chartSL = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Sản lượng',
          data: values,
          backgroundColor: 'rgba(0, 184, 148, 0.72)',
          borderColor: '#00b894',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ' ' + fmtNum(ctx.raw) + ' cây';
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

/** Bảng top công nợ khách hàng */
function renderNoKhachTable(noList) {
  const tbody = document.getElementById('baocao-no-tbody');
  const countEl = document.getElementById('baocao-no-count');
  if (!tbody) return;

  const sorted = noList
    .filter(function (r) { return r.conNo > 0; })
    .sort(function (a, b) { return b.conNo - a.conNo; })
    .slice(0, 10);

  if (countEl) countEl.textContent = sorted.length + ' KH còn nợ';

  if (!sorted.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">Tất cả khách hàng đã thanh toán ✓</td></tr>';
    return;
  }

  tbody.innerHTML = sorted
    .map(function (r, i) {
      return (
        '<tr>' +
        '<td style="color:var(--muted);font-size:12px">' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(r.ten) + '</td>' +
        '<td style="text-align:right">' + fmtNum(Math.round(r.tongNo)) + ' đ</td>' +
        '<td style="text-align:right;color:var(--green)">' + fmtNum(Math.round(r.daTT)) + ' đ</td>' +
        '<td style="text-align:right;font-weight:700;color:var(--red)">' + fmtNum(Math.round(r.conNo)) + ' đ</td>' +
        '</tr>'
      );
    })
    .join('');
}

/** In báo cáo: thêm class print-baocao để CSS print biết đang in trang báo cáo */
function printBaoCao() {
  document.body.classList.add('print-baocao');
  window.print();
  window.addEventListener(
    'afterprint',
    function () {
      document.body.classList.remove('print-baocao');
    },
    { once: true }
  );
}

function setBaoCaoLoading(on) {
  const loading = document.getElementById('baocao-loading');
  const content = document.getElementById('baocao-content');
  if (loading) loading.style.display = on ? 'flex' : 'none';
  if (content && on) content.style.display = 'none';
}
