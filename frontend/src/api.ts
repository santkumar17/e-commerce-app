import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type Role = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

let tokenCache: string | null = null;

export async function setToken(token: string | null) {
  tokenCache = token;
  if (token) await AsyncStorage.setItem('token', token);
  else await AsyncStorage.removeItem('token');
}

export async function getToken(): Promise<string | null> {
  if (tokenCache) return tokenCache;
  const t = await AsyncStorage.getItem('token');
  tokenCache = t;
  return t;
}

async function req(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

async function uploadImage(uri: string, mimeType: string): Promise<{ url: string }> {
  const token = await getToken();
  const ext = mimeType.split('/')[1] || 'jpg';
  const form = new FormData();
  // React Native's fetch/FormData accepts this {uri, name, type} shape for file uploads.
  form.append('file', { uri, name: `photo.${ext}`, type: mimeType } as any);
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/uploads/image`, { method: 'POST', body: form, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

export const api = {
  register: (body: { name: string; email: string; password: string; role: Role }) =>
    req('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req('/auth/me'),

  seed: () => req('/seed', { method: 'POST' }),
  categories: () => req('/categories'),
  products: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    const qs = q.toString();
    return req(`/products${qs ? `?${qs}` : ''}`);
  },
  product: (id: string) => req(`/products/${id}`),
  featured: () => req('/products/featured'),

  uploadImage,
  createProduct: (body: any) => req('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: any) => req(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id: string) => req(`/products/${id}`, { method: 'DELETE' }),
  sellerProducts: () => req('/seller/products'),

  pending: () => req('/admin/products/pending'),
  approve: (id: string) => req(`/admin/products/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) =>
    req(`/admin/products/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  adminStats: () => req('/admin/stats'),

  cart: () => req('/cart'),
  addToCart: (product_id: string, qty = 1) =>
    req('/cart', { method: 'POST', body: JSON.stringify({ product_id, qty }) }),
  removeFromCart: (product_id: string) => req(`/cart/${product_id}`, { method: 'DELETE' }),

  wishlist: () => req('/wishlist'),
  addWishlist: (id: string) => req(`/wishlist/${id}`, { method: 'POST' }),
  removeWishlist: (id: string) => req(`/wishlist/${id}`, { method: 'DELETE' }),

  checkout: (address: any, coupon_code?: string) =>
    req('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ address, payment_method: 'cod', coupon_code }),
    }),
  orders: () => req('/orders'),
  setOrderStatus: (id: string, status: string) =>
    req(`/orders/${id}/status?status=${status}`, { method: 'POST' }),

  reviews: (pid: string) => req(`/products/${pid}/reviews`),
  addReview: (body: { product_id: string; rating: number; comment: string; order_id?: string }) =>
    req('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  generateDescription: (body: { title: string; keywords?: string; materials?: string }) =>
    req('/ai/generate-description', { method: 'POST', body: JSON.stringify(body) }),

  seller: (sid: string) => req(`/sellers/${sid}`),
  adminListSellers: () => req('/admin/sellers'),
  adminVerifySeller: (sid: string, verified: boolean) =>
    req(`/admin/sellers/${sid}/verify?verified=${verified}`, { method: 'POST' }),

  adminListCoupons: () => req('/admin/coupons'),
  adminCreateCoupon: (body: { code: string; discount_type: 'percent' | 'flat'; value: number; min_order?: number; active?: boolean }) =>
    req('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
  adminDeleteCoupon: (code: string) => req(`/admin/coupons/${code}`, { method: 'DELETE' }),
  validateCoupon: (code: string, subtotal: number) =>
    req('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),

  notifications: () => req('/notifications'),
  markNotifRead: (nid: string) => req(`/notifications/${nid}/read`, { method: 'POST' }),
  markAllNotifRead: () => req('/notifications/read-all', { method: 'POST' }),
};
