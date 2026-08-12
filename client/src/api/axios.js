import axios from 'axios';

// In dev this is '/api' (Vite proxies it to the gateway). In production set
// VITE_API_URL to the gateway's public base INCLUDING /api, e.g.
//   https://feastfleet-gateway.onrender.com/api
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,                           // for the refresh-token cookie
});

// Render's free plan sleeps a service after ~15 min idle. Hitting the gateway's
// /warm makes it boot every downstream service in parallel, so the auth/order
// calls that come later in the session don't each pay their own cold start.
// Fire-and-forget: it resolves in ~1min on a cold stack and nothing awaits it.
export const warmBackend = () => {
  const base = API_BASE.replace(/\/api\/?$/, '');
  return axios.get(`${base}/warm`, { timeout: 90000 }).catch(() => {});
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        // Use raw axios (not `api`) to avoid re-triggering this interceptor,
        // but the same base so it hits the gateway in production.
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.data.accessToken);
        orig.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(orig);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
