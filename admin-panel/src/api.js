import { getToken, clearSession } from './auth.js';

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? 'http://localhost:4100' : '');

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  const token = getToken();
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  let payload = body;
  if (body) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers: finalHeaders, body: payload });

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

  login: (payload) => request('/api/auth/admin/login', { method: 'POST', body: payload }),
  me:    ()        => request('/api/auth/me'),
  updateMe:       (payload) => request('/api/auth/me', { method: 'PATCH', body: payload }),
  changePassword: (payload) => request('/api/auth/me/password', { method: 'POST', body: payload }),

  listReports: (status) => request(`/api/reports${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  getReport:   (id) => request(`/api/reports/${id}`),
  updateReport:(id, body) => request(`/api/reports/${id}`, { method: 'PATCH', body }),
  stats:       () => request('/api/reports/stats'),
  analytics:   (days = 30) => request(`/api/reports/analytics?days=${days}`),

  listUsers: ({ role, q } = {}) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (q)    params.set('q', q);
    const qs = params.toString();
    return request(`/api/users${qs ? `?${qs}` : ''}`);
  },
  getUser:     (id)        => request(`/api/users/${id}`),
  createUser:  (body)      => request('/api/users',          { method: 'POST',   body }),
  updateUser:  (id, body)  => request(`/api/users/${id}`,    { method: 'PATCH',  body }),
  deleteUser:  (id)        => request(`/api/users/${id}`,    { method: 'DELETE' }),
  usersSummary:()          => request('/api/users/summary'),
};
