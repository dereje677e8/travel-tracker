import { api } from './axiosClient.js';

async function downloadFile(url, params, filename) {
  const response = await api.get(url, { params, responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const reportsApi = {
  exportExcel: (params) => downloadFile('/reports/export.xlsx', params, 'travel-report.xlsx'),
  exportPdf: (params) => downloadFile('/reports/export.pdf', params, 'travel-report.pdf'),
};
