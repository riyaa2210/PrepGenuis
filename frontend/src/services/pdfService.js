import api from './api';

export const downloadResumePDF = () =>
  api.get('/pdf/resume', { responseType: 'blob' });

export const downloadReportPDF = (interviewId) =>
  api.get(`/pdf/report/${interviewId}`, { responseType: 'blob' });

export const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
