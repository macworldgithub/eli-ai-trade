import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${API_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Market
export const marketAPI = {
  getInstruments: () => api.get('/instruments'),
  getAllMarketData: () => api.get('/market/all'),
  getHistorical: (symbol, range = '1mo') =>
    api.get(`/market/${encodeURIComponent(symbol)}/historical?range=${range}`),
};

// AI Engine
export const aiAPI = {
  getRules: () => api.get('/ai/rules'),
  updateRules: (rules) => api.put('/ai/rules', { rules }),
  getVerdict: (symbol) => api.get(`/ai/verdict/${encodeURIComponent(symbol)}`),
  getAllVerdicts: () => api.get('/ai/verdicts'),
  refreshVerdicts: () => api.post('/ai/verdicts/refresh'),
  coachScore: (tradeId) => api.post(`/ai/coach/score/${tradeId}`),
  coachPatterns: () => api.get('/ai/coach/patterns'),
};

// Trade Journal
export const tradeAPI = {
  getTrades: (status) => api.get('/trades', { params: { status } }),
  getTradeStats: () => api.get('/trades/stats'),
  createTrade: (data) => api.post('/trades', data),
  updateTrade: (id, data) => api.put(`/trades/${id}`, data),
  deleteTrade: (id) => api.delete(`/trades/${id}`),
};

// Risk Calculator
export const riskAPI = {
  calculateRisk: (data) => api.post('/risk/calculate', data),
};

// Calendar
export const calendarAPI = {
  getEvents: () => api.get('/calendar/events'),
};

// Sessions
export const sessionAPI = {
  getStatus: () => api.get('/sessions/status'),
};

// Reports
export const reportsAPI = {
  equityCurve: () => api.get('/reports/equity-curve'),
};

// Alerts
export const alertsAPI = {
  getConfig: () => api.get('/alerts/config'),
  listRecipients: () => api.get('/alerts/recipients'),
  addRecipient: (email, enabled = true) => api.post('/alerts/recipients', { email, enabled }),
  toggleRecipient: (id, email, enabled) => api.put(`/alerts/recipients/${id}`, { email, enabled }),
  deleteRecipient: (id) => api.delete(`/alerts/recipients/${id}`),
  preview: () => api.post('/alerts/preview'),
  testSend: () => api.post('/alerts/test-send'),
  dispatchNow: () => api.post('/alerts/dispatch-now'),
  history: (limit = 50) => api.get(`/alerts/history?limit=${limit}`),
};

export default api;
