import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach admin JWT if present
api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

// ─── Auth (admin only) ───────────────────────────────────
export const login = (data) => api.post('/auth/login', data);

// ─── Menu (public) ───────────────────────────────────────
export const getMenu = () => api.get('/menu');

// ─── Menu management (admin) ─────────────────────────────
export const addMenuItem = (data) => api.post('/menu', data);
export const updateMenuItem = (id, d) => api.put(`/menu/${id}`, d);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);

// ─── Guest Orders (no login needed) ─────────────────────
export const placeGuestOrder = (data) => api.post('/orders/guest', data);
export const pollOrderStatus = (id) => api.get(`/orders/status/${id}`);
export const getQRCode = (host) => api.get('/orders/qr', { params: { host } });

// ─── Admin Orders ─────────────────────────────────────────
export const getAdminOrders = () => api.get('/orders');
export const markReady = (id) => api.put(`/orders/${id}/ready`);
export const markCollected = (id) => api.put(`/orders/${id}/collected`);
export const confirmPayment = (id) => api.put(`/orders/${id}/confirm-payment`);

export default api;
