import { getToken, clearSession } from './auth.js';

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? 'http://localhost:4100' : '');

async function request(path, { method = 'GET', body, headers = {}, multipart = false } = {}) {
  const finalHeaders = { ...headers };
  const token = getToken();
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  let payload = body;
  if (body && !multipart) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: payload,
  });

  if (res.status === 401) {
    clearSession();
    if (!path.startsWith('/api/auth/')) {
      window.location.hash = '#/login';
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  base: API_BASE,
  asset: (relative) => (relative ? `${API_BASE}${relative}` : ''),

  register: (payload) => request('/api/auth/citizen/register', { method: 'POST', body: payload }),
  login:    (payload) => request('/api/auth/citizen/login',    { method: 'POST', body: payload }),
  me:       ()        => request('/api/auth/me'),
  updateMe: (payload) => request('/api/auth/me', { method: 'PATCH', body: payload }),
  changePassword: (payload) => request('/api/auth/me/password', { method: 'POST', body: payload }),

  listMyReports: () => request('/api/reports'),
  getReport:     (id) => request(`/api/reports/${id}`),
  createReport:  (formData) => request('/api/reports', { method: 'POST', body: formData, multipart: true }),
  rateReport:    (id, rating) => request(`/api/reports/${id}/rate`, { method: 'POST', body: { rating } }),
};
