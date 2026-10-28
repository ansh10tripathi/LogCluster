import axios from 'axios';

const API_BASE = '/api';

export const api = {
  async checkHealth() {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  async loadSample() {
    const res = await axios.post(`${API_BASE}/sample`);
    return res.data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async analyzeLogs(params) {
    const res = await axios.post(`${API_BASE}/analyze`, params);
    return res.data;
  },

  async getResults(analysisId) {
    const res = await axios.get(`${API_BASE}/results/${analysisId}`);
    return res.data;
  },

  getLogsCsvUrl(analysisId) {
    return `${API_BASE}/export/logs/${analysisId}`;
  },

  getClustersCsvUrl(analysisId) {
    return `${API_BASE}/export/clusters/${analysisId}`;
  },

  getReportUrl(analysisId) {
    return `${API_BASE}/export/report/${analysisId}`;
  }
};
