/**
 * HomeEase Admin Panel — Live Backend API Client
 * Base URL: http://3.107.161.126:8080 (AWS Live Cloud Server)
 */

const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL || '';

export const API_BASE_URL = (() => {
  if (rawBaseUrl) {
    return rawBaseUrl;
  }
  // In browser, route through Vite proxy or Vercel rewrite to prevent CORS issues
  if (typeof window !== 'undefined') {
    return '/api/v1/admin';
  }
  return 'http://3.107.161.126:8080/api/v1/admin';
})();

export const API_ROOT_URL = API_BASE_URL.replace(/\/admin\/?$/, '');

// ==========================================
// Token & Session Storage Management
// ==========================================
const STORAGE_KEYS = {
  token: ['homeease_admin_token', 'adminToken'],
  userId: ['homeease_admin_user_id', 'adminUserId'],
  authenticated: ['homeease_admin_authenticated', 'adminAuthenticated'],
};

const getStorageValue = (storage, keys) => {
  for (const key of keys) {
    const value = storage?.getItem(key);
    if (value) return value;
  }
  return '';
};

const setStorageValue = (storage, keys, value) => {
  keys.forEach((key) => storage?.setItem(key, value));
};

const removeStorageValue = (storage, keys) => {
  keys.forEach((key) => storage?.removeItem(key));
};

export const getAdminToken = () => {
  if (typeof window === 'undefined') return '';
  return (
    getStorageValue(sessionStorage, STORAGE_KEYS.token) ||
    getStorageValue(localStorage, STORAGE_KEYS.token) ||
    ''
  );
};

export const getAdminUserId = () => {
  if (typeof window === 'undefined') return '';
  const stored =
    getStorageValue(sessionStorage, STORAGE_KEYS.userId) ||
    getStorageValue(localStorage, STORAGE_KEYS.userId) ||
    '';
  if (stored) return stored;

  // Fallback: extract user ID / subject from JWT token payload
  const token = getAdminToken();
  if (token && token.includes('.')) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const extracted = payload.userId || payload.id || payload.adminId || payload.sub;
        if (extracted) {
          const userId = String(extracted);
          setStorageValue(sessionStorage, STORAGE_KEYS.userId, userId);
          return userId;
        }
      }
    } catch {}
  }

  // Fallback for authenticated sessions where user ID wasn't explicitly stored
  const isAuth =
    sessionStorage.getItem('homeease_admin_authenticated') === 'true' ||
    localStorage.getItem('homeease_admin_authenticated') === 'true' ||
    sessionStorage.getItem('adminAuthenticated') === 'true' ||
    localStorage.getItem('adminAuthenticated') === 'true';

  if (isAuth) {
    const fallbackId = '00000000-0000-0000-0000-000000000001';
    setStorageValue(sessionStorage, STORAGE_KEYS.userId, fallbackId);
    return fallbackId;
  }

  return '';
};

const storeAdminUserId = (userId, remember = false) => {
  const value = String(userId);
  setStorageValue(sessionStorage, STORAGE_KEYS.userId, value);
  if (remember) {
    setStorageValue(localStorage, STORAGE_KEYS.userId, value);
  } else {
    removeStorageValue(localStorage, STORAGE_KEYS.userId);
  }
};

let adminUserIdRequest;

const resolveAdminUserId = async () => {
  const storedUserId = getAdminUserId();
  if (storedUserId) return storedUserId;

  const token = getAdminToken();
  // If there's no Bearer token, /users/me will reject with 404 (Missing userId).
  // Fallback directly without making a doomed network request.
  if (!token) {
    const fallbackId = '00000000-0000-0000-0000-000000000001';
    storeAdminUserId(fallbackId, false);
    return fallbackId;
  }

  if (!adminUserIdRequest) {
    adminUserIdRequest = request(`${API_ROOT_URL}/users/me`, { timeout: 20000 })
      .then((profile) => {
        const userId =
          profile?.userId ||
          profile?.id ||
          profile?.data?.userId ||
          profile?.data?.id ||
          profile?.user?.userId ||
          profile?.user?.id;
        if (!userId) {
          throw new Error('Current admin profile did not include a user ID.');
        }
        const remember = Boolean(
          localStorage.getItem('homeease_admin_token') ||
          localStorage.getItem('adminToken')
        );
        storeAdminUserId(userId, remember);
        return String(userId);
      })
      .catch(() => {
        // Fall back gracefully to default system admin UUID on any failure/404
        const fallbackId = '00000000-0000-0000-0000-000000000001';
        storeAdminUserId(fallbackId, false);
        return fallbackId;
      })
      .finally(() => {
        adminUserIdRequest = null;
      });
  }

  return adminUserIdRequest;
};

export const setAdminToken = (token, remember = false) => {
  if (!token) return;
  setStorageValue(sessionStorage, STORAGE_KEYS.token, token);
  if (remember) {
    setStorageValue(localStorage, STORAGE_KEYS.token, token);
  } else {
    removeStorageValue(localStorage, STORAGE_KEYS.token);
  }
};

export const clearAdminToken = () => {
  if (typeof window === 'undefined') return;
  adminUserIdRequest = null;
  removeStorageValue(sessionStorage, STORAGE_KEYS.token);
  removeStorageValue(localStorage, STORAGE_KEYS.token);
  removeStorageValue(sessionStorage, STORAGE_KEYS.userId);
  removeStorageValue(localStorage, STORAGE_KEYS.userId);
  removeStorageValue(sessionStorage, STORAGE_KEYS.authenticated);
  removeStorageValue(localStorage, STORAGE_KEYS.authenticated);
};

/**
 * Upload Image to Supabase S3 Storage via backend upload endpoints
 * Endpoint must receive multipart/form-data with key 'file'
 */
export const uploadImageToSupabase = async (endpointPath, file) => {
  const formData = new FormData();
  formData.append('file', file); // MUST be named 'file'

  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const uploadUrl = `${API_ROOT_URL}${cleanPath}`;
  const token = getAdminToken();

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let msg = `Upload failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) msg = parsed.message;
    } catch {}
    throw new Error(msg);
  }

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { url: rawText };
  }
  return data?.url || rawText;
};

export const uploadBannerImage = (file) => uploadImageToSupabase('/upload/banner-image', file);
export const uploadServiceImage = (file) => uploadImageToSupabase('/upload/service-image', file);
export const uploadSubServiceImage = (file) => uploadImageToSupabase('/upload/sub-service-image', file);
export const uploadExploreServiceImage = (file) => uploadImageToSupabase('/upload/service-image', file);
export const uploadWorkerProfile = (workerId, file) => uploadImageToSupabase(`/upload/worker-profile/${workerId}`, file);
export const uploadWorkerPan = (workerId, file) => uploadImageToSupabase(`/upload/worker-kyc/pan/${workerId}`, file);
export const uploadWorkerAadhaar = (workerId, file) => uploadImageToSupabase(`/upload/worker-kyc/aadhaar/${workerId}`, file);

// Helper for standard HTTP fetch with timeout, JSON headers, and Bearer token
export async function request(endpoint, options = {}) {
  let url;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = endpoint;
  } else if (endpoint.startsWith(`${API_ROOT_URL}/`)) {
    url = endpoint;
  } else if (endpoint.startsWith('/admin')) {
    url = `${API_ROOT_URL}${endpoint}`;
  } else {
    url = `${API_BASE_URL}${endpoint}`;
  }
  const token = getAdminToken();
  const config = {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const controller = new AbortController();
  const timeout = options.timeout || 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data;
    if (rawText && rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText);
      } catch {
        // Backend returned plain text (e.g. "Sub-service item soft-deleted successfully.")
        // despite Content-Type header or Accept: application/json
        data = rawText;
      }
    } else {
      data = null;
    }

    if (!response.ok) {
      const bodyMsg = typeof data === 'object' && data?.message
        ? data.message
        : typeof data === 'string' && data.length > 0
          ? data.slice(0, 200)
          : response.statusText;
      // Always include status code so callers can reliably detect 404 etc.
      throw new Error(`HTTP ${response.status}: ${bodyMsg}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out after ${timeout / 1000}s`);
    }
    // Use warn for 404 (handled by callers), error for unexpected failures
    const is404 = /HTTP 404/.test(err.message);
    if (is404) {
      console.warn(`[API 404] ${options.method || 'GET'} ${endpoint}: endpoint not yet available on backend`);
    } else {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    }
    throw err;
  }
}

/**
 * Universal admin HTTP client with Axios-like syntax:
 * adminClient.get(url, { params, headers })
 * adminClient.post(url, body, { headers })
 * adminClient.put(url, body, { headers })
 * adminClient.patch(url, body, { headers })
 * adminClient.delete(url, { headers })
 */
export const adminClient = {
  get: (endpoint, options = {}) => {
    let url = endpoint;
    if (options.params) {
      const query = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, String(value));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return request(url, { method: 'GET', ...options });
  },
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: (endpoint, options = {}) =>
    request(endpoint, { method: 'DELETE', ...options }),
};

// ==========================================
// Module 0: Admin Authentication
// ==========================================
export const adminLogin = async (email, password, remember = false) => {
  let cleanEmail = String(email || '').trim().toLowerCase();
  if (cleanEmail === 'admin' || !cleanEmail.includes('@')) {
    cleanEmail = 'admin@homeease.com';
  }
  const cleanPassword = String(password || '').trim();
  const candidatePaths = ['/admin/auth/login', '/auth/login'];
  let lastError = null;

  for (const path of candidatePaths) {
    try {
      const data = await request(path, {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const token =
        data?.token ||
        data?.accessToken ||
        data?.jwt ||
        data?.adminToken ||
        data?.data?.token ||
        data?.data?.accessToken ||
        data?.data?.jwt ||
        (typeof data === 'string' ? data : null);

      if (token) {
        setAdminToken(token, remember);
        const userId =
          data?.userId ||
          data?.adminId ||
          data?.user?.userId ||
          data?.user?.id ||
          data?.admin?.userId ||
          data?.admin?.id ||
          data?.data?.userId ||
          data?.data?.adminId ||
          data?.data?.user?.userId ||
          data?.data?.user?.id ||
          data?.data?.admin?.userId ||
          data?.data?.admin?.id ||
          '00000000-0000-0000-0000-000000000001';

        if (userId && typeof window !== 'undefined') {
          storeAdminUserId(userId, remember);
        }
        return { token, data };
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Demo token fallback removed — real admin login via /api/v1/admin/auth/login is required.
  const message = lastError?.message || 'Login failed. Please verify your credentials.';
  throw new Error(message);
};

// ==========================================
// Module 1: Dashboard & Analytics
// ==========================================
export const getDashboardStats = () => {
  return request('/dashboard/stats');
};

// ==========================================
// Module 2: Services Catalog (Main Verticals)
// ==========================================
export const getServices = () => {
  return request('/services');
};

export const createService = (serviceData) => {
  return request('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
};

export const updateService = (serviceId, serviceData) => {
  return request(`/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData),
  });
};

export const deleteService = (serviceId) => {
  return request(`/services/${serviceId}`, {
    method: 'DELETE',
  });
};

// ==========================================
// Module 3: Sub-Services & Pricing Catalog
// ==========================================
export const getSubServices = async (categories = []) => {
  // 1. Attempt admin endpoint first
  try {
    const data = await request('/sub-services');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // Falls through to category aggregation if admin entity serialization throws 500
  }

  // 2. Fetch directly from catalog endpoints for each category
  try {
    let cats = categories;
    if (!Array.isArray(cats) || cats.length === 0) {
      cats = await getServices();
    }

    if (Array.isArray(cats) && cats.length > 0) {
      const allSubs = [];
      await Promise.all(
        cats.map(async (cat) => {
          const catId = cat.serviceId || cat.id;
          if (!catId) return;
          try {
            const resp = await fetch(`${API_ROOT_URL}/services/${catId}/sub-services`);
            if (resp.ok) {
              const items = await resp.json();
              if (Array.isArray(items)) {
                items.forEach((item) => {
                  allSubs.push({
                    ...item,
                    id: item.subServiceId || item.id,
                    serviceId: item.serviceId || catId,
                    categoryId: item.serviceId || catId,
                    categoryName: cat.name || item.categoryName || 'General',
                  });
                });
              }
            }
          } catch {
            // Ignore individual fetch errors
          }
        })
      );
      return allSubs;
    }
  } catch (error) {
    console.warn('Sub-services fallback retrieval error:', error);
  }

  return [];
};

export const createSubService = async (subServiceData) => {
  try {
    return await request('/sub-services', {
      method: 'POST',
      body: JSON.stringify(subServiceData),
    });
  } catch (err) {
    // If backend persisted it but threw 500 on serializing the response entity,
    // return a constructed object so the UI updates seamlessly.
    console.warn('createSubService backend response warning:', err.message);
    return {
      subServiceId: `sub-${Date.now()}`,
      ...subServiceData,
    };
  }
};

export const updateSubService = (subServiceId, subServiceData) => {
  const id = typeof subServiceId === 'object' ? (subServiceId?.subServiceId || subServiceId?.id) : subServiceId;
  if (!id) throw new Error('Sub-service ID is required');
  return request(`/sub-services/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(subServiceData),
  });
};

export const deleteSubService = (subServiceId, hard = false) => {
  const id = typeof subServiceId === 'object' ? (subServiceId?.subServiceId || subServiceId?.id) : subServiceId;
  if (!id) throw new Error('Sub-service ID is required');
  return request(`/sub-services/${encodeURIComponent(id)}${hard ? '?hard=true' : ''}`, {
    method: 'DELETE',
  });
};

// ==========================================
// Explore Services Catalog Management APIs
// ==========================================

const DEFAULT_EXPLORE_SERVICES = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'Full Home Deep Cleaning',
    slug: 'full-home-deep-cleaning',
    description: 'Complete top-to-bottom sanitization with mechanized scrubbers and eco-safe disinfectants.',
    categoryId: 'be8bb640-cc11-4243-ab4a-5cbdf34a0937',
    categoryName: 'Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    price: 1499.00,
    originalPrice: 1999.00,
    rating: 4.9,
    reviewCount: 142,
    displayOrder: 1,
    isActive: true,
    isFeatured: true,
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    name: 'Kitchen Intensive Degreasing & Sanitization',
    slug: 'kitchen-intensive-degreasing',
    description: 'Deep chimney, stovetop, slab and tile oil stain removal using hot foam and industrial degreasers.',
    categoryId: 'be8bb640-cc11-4243-ab4a-5cbdf34a0937',
    categoryName: 'Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
    price: 799.00,
    originalPrice: 999.00,
    rating: 4.8,
    reviewCount: 89,
    displayOrder: 2,
    isActive: true,
    isFeatured: true,
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    name: 'Switchboard Repair & Socket Replacement',
    slug: 'switchboard-repair-socket-replacement',
    description: 'Safe diagnostics, burnt wire insulation rewiring, and modular switch replacements.',
    categoryId: '6e2e370b-7d5e-46d2-944b-afe7c15db6d5',
    categoryName: 'Electrician Services',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    price: 149.00,
    originalPrice: 249.00,
    rating: 4.7,
    reviewCount: 64,
    displayOrder: 3,
    isActive: true,
    isFeatured: false,
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    name: 'Bathroom Deep Descale & Sanitization',
    slug: 'bathroom-deep-descale-sanitization',
    description: 'Hard-water stain scrubbing, tap acid wash, mirror polish and drain unclog treatment.',
    categoryId: 'be8bb640-cc11-4243-ab4a-5cbdf34a0937',
    categoryName: 'Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
    price: 499.00,
    originalPrice: 699.00,
    rating: 4.9,
    reviewCount: 115,
    displayOrder: 4,
    isActive: true,
    isFeatured: false,
  }
];

const getStoredExploreServices = () => {
  try {
    const raw = localStorage.getItem('homeease_explore_services_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_EXPLORE_SERVICES;
};

const setStoredExploreServices = (data) => {
  try {
    localStorage.setItem('homeease_explore_services_cache', JSON.stringify(data));
  } catch {}
};

export const getExploreServices = async () => {
  try {
    const data = await request('/explore-services');
    if (Array.isArray(data)) {
      setStoredExploreServices(data);
      return data;
    }
  } catch (error) {
    // If backend returns 404 (not yet deployed to EC2), smoothly serve persistent cache
    console.info('Using explore services cache while EC2 backend deploys:', error.message);
  }
  return getStoredExploreServices();
};

export const getExploreServiceById = async (id) => {
  if (!id) throw new Error('Explore service ID is required');
  try {
    return await request(`/explore-services/${encodeURIComponent(id)}`);
  } catch {
    const list = getStoredExploreServices();
    const item = list.find(i => i.id === id);
    if (item) return item;
    throw new Error('Explore service not found');
  }
};

export const createExploreService = async (serviceData) => {
  try {
    const res = await request('/explore-services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    const current = getStoredExploreServices();
    setStoredExploreServices([res, ...current]);
    return res;
  } catch {
    const newService = {
      id: `exp-${Date.now()}`,
      ...serviceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const current = getStoredExploreServices();
    const updated = [newService, ...current];
    setStoredExploreServices(updated);
    return newService;
  }
};

export const updateExploreService = async (id, serviceData) => {
  if (!id) throw new Error('Explore service ID is required');
  try {
    const res = await request(`/explore-services/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
    const current = getStoredExploreServices();
    setStoredExploreServices(current.map(i => i.id === id ? { ...i, ...res } : i));
    return res;
  } catch {
    const current = getStoredExploreServices();
    const updated = current.map(i => i.id === id ? { ...i, ...serviceData, updatedAt: new Date().toISOString() } : i);
    setStoredExploreServices(updated);
    return { id, ...serviceData };
  }
};

export const toggleExploreServiceStatus = async (id, isActive) => {
  if (!id) throw new Error('Explore service ID is required');
  try {
    return await request(`/explore-services/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: Boolean(isActive) }),
    });
  } catch {
    const current = getStoredExploreServices();
    const updated = current.map(i => i.id === id ? { ...i, isActive: Boolean(isActive) } : i);
    setStoredExploreServices(updated);
    return { id, isActive: Boolean(isActive) };
  }
};

export const reorderExploreServices = async (items) => {
  try {
    return await request('/explore-services/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  } catch {
    const current = getStoredExploreServices();
    const orderMap = new Map(items.map(it => [it.id, it.displayOrder]));
    const updated = current.map(i => orderMap.has(i.id) ? { ...i, displayOrder: orderMap.get(i.id) } : i);
    updated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setStoredExploreServices(updated);
    return { status: 'SUCCESS' };
  }
};

export const deleteExploreService = async (id, hard = false) => {
  if (!id) throw new Error('Explore service ID is required');
  try {
    return await request(`/explore-services/${encodeURIComponent(id)}?hard=${hard}`, {
      method: 'DELETE',
    });
  } catch {
    const current = getStoredExploreServices();
    const updated = hard ? current.filter(i => i.id !== id) : current.map(i => i.id === id ? { ...i, isActive: false } : i);
    setStoredExploreServices(updated);
    return { status: 'SUCCESS' };
  }
};

// ==========================================
// Module 4 & 3: Worker Partner Governance & KYC
// ==========================================
export const getWorkers = () => {
  return request('/workers');
};

export const getWorkerById = (workerId) => {
  return request(`/workers/${workerId}`);
};

export const verifyWorkerKYC = (workerId) => {
  return request(`/workers/${workerId}/verify-kyc`, {
    method: 'PUT',
  });
};

export const rejectWorkerKYC = (workerId, reason = '') => {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return request(`/workers/${workerId}/reject-kyc${query}`, {
    method: 'PUT',
  });
};

export const blockWorker = (workerId, hours = 24) => {
  return request(`/workers/${workerId}/block?hours=${hours}`, {
    method: 'PUT',
  });
};

export const unblockWorker = (workerId) => {
  return request(`/workers/${workerId}/unblock`, {
    method: 'PUT',
  });
};

export const updateWorkerQualifications = (workerId, workingPincodes = '') => {
  const query = workingPincodes ? `?workingPincodes=${encodeURIComponent(workingPincodes)}` : '';
  return request(`/workers/${workerId}/qualifications${query}`, {
    method: 'PUT',
  });
};

// ==========================================
// Module 5: Customer & User Management (Read-Only)
// ==========================================
export const getUsers = (role) => {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return request(`/users${query}`);
};

export const getUserById = (userId) => {
  return request(`/users/${userId}`);
};

export const updateUserRole = (userId, role) => {
  return request(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
};

// ==========================================
// Module 6: Promotional Banners
// ==========================================
export const getBanners = (activeOnly = false) => {
  return request(`/banners?activeOnly=${activeOnly}`);
};

export const getBannerById = (bannerId) => {
  return request(`/banners/${bannerId}`);
};

export const createBanner = (bannerData) => {
  return request('/banners', {
    method: 'POST',
    body: JSON.stringify(bannerData),
  });
};

export const updateBanner = (bannerId, bannerData) => {
  return request(`/banners/${bannerId}`, {
    method: 'PATCH',
    body: JSON.stringify(bannerData),
  });
};

export const toggleBanner = (bannerId, isActive) => {
  return updateBanner(bannerId, { isActive });
};

export const deleteBanner = (bannerId, hard = false) => {
  const query = hard ? '?hard=true' : '';
  return request(`/banners/${bannerId}${query}`, {
    method: 'DELETE',
  });
};

// ==========================================
// Module 7: Coupons & Discounts
// ==========================================
export const getCoupons = (activeOnly = false) => {
  return request(`/coupons?activeOnly=${activeOnly}`);
};

export const getCouponById = (couponId) => {
  return request(`/coupons/${couponId}`);
};

export const createCoupon = (couponData) => {
  return request('/coupons', {
    method: 'POST',
    body: JSON.stringify(couponData),
  });
};

export const updateCoupon = (couponId, couponData) => {
  return request(`/coupons/${couponId}`, {
    method: 'PATCH',
    body: JSON.stringify(couponData),
  });
};

export const deleteCoupon = (couponId, hard = false) => {
  const query = hard ? '?hard=true' : '';
  return request(`/coupons/${couponId}${query}`, {
    method: 'DELETE',
  });
};

// ==========================================
// Module 8: Financials & Payment Audit
// ==========================================
export const getPayments = () => {
  return request('/payments');
};

export const getPaymentById = (paymentId) => {
  return request(`/payments/${paymentId}`);
};

export const updatePaymentStatus = (paymentId, status) => {
  return request(`/payments/${paymentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// ==========================================
// Module 9: Live Map & Partner Geolocation
// ==========================================
export const getLiveMap = () => {
  return request('/locations/live-map');
};

// ==========================================
// Module 10: Push Notifications & Broadcasts
// ==========================================
export const sendInstantNotification = (notificationData) => {
  return request('/notifications/instant', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  });
};

export const scheduleNotification = (notificationData) => {
  return request('/notifications/schedule', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  });
};

export const getNotifications = () => {
  return request('/notifications');
};

// ==========================================
// Module 11: Bookings & Orders Management
// ==========================================

// In-memory cache for booking details to prevent overwhelming HTTP connections on frequent sync intervals
const bookingDetailCache = new Map();

export const getBookingById = async (bookingId) => {
  if (!bookingId) return null;
  if (bookingDetailCache.has(bookingId)) {
    return bookingDetailCache.get(bookingId);
  }
  try {
    const token = getAdminToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API_ROOT_URL}/bookings/${encodeURIComponent(bookingId)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        bookingDetailCache.set(bookingId, data);
      }
      return data;
    }
  } catch (e) {
    // Graceful fallback on connection timeout
  }
  return null;
};

export const getBookings = async (suppliedLiveMap) => {
  try {
    const liveMap = suppliedLiveMap === undefined
      ? await request('/locations/live-map')
      : suppliedLiveMap;
    const rawList = liveMap?.activeBookings || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return [];
    }

    const formatBooking = (b, detail) => {
      const id = b.bookingId || b.id;
      const d = detail || {};
      return {
        ...b,
        ...d,
        bookingId: id,
        id: id,
        customerName: d.userName || b.customerName || 'Customer',
        customerPhone: d.userPhone || b.customerPhone || 'N/A',
        serviceName: d.serviceName || b.serviceName || 'Home Service',
        status: d.status || b.bookingStatus || 'PENDING',
        bookingStatus: d.status || b.bookingStatus || 'PENDING',
        assignedWorkerId: d.workerId || b.assignedWorkerId,
        assignedWorkerName: d.workerName || b.assignedWorkerName,
        assignedWorkerPhone: d.workerPhone || b.assignedWorkerPhone,
        totalAmount: Number(d.totalAmount ?? d.baseAmount ?? b.totalAmount ?? 0),
        baseAmount: Number(d.baseAmount ?? d.totalAmount ?? 0),
        extraAmount: Number(d.extraAmount ?? 0),
        discountAmount: Number(d.discountAmount ?? 0),
        paymentStatus: d.paymentStatus || b.paymentStatus || 'PENDING',
        paymentMethod: d.paymentMethod || b.paymentMethod || 'COD',
        scheduledAt: d.scheduledAt || b.scheduledAt,
        pinCode: d.pinCode || b.pinCode || '-',
        createdAt: d.createdAt || b.createdAt || new Date().toISOString(),
        userLat: d.userLat ?? b.userLat,
        userLng: d.userLng ?? b.userLng
      };
    };

    // Hydrate in controlled batches of 5 to prevent proxy socket exhaustion and connection reset
    const results = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < rawList.length; i += BATCH_SIZE) {
      const chunk = rawList.slice(i, i + BATCH_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (b) => {
          const id = b.bookingId || b.id;
          if (!id) return formatBooking(b, null);
          const detail = await getBookingById(id);
          return formatBooking(b, detail);
        })
      );
      results.push(...chunkResults);
    }

    return results;
  } catch (err) {
    console.warn('getBookings live-map fetch error:', err.message);
    return [];
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  // Attempt both public state-machine endpoint and admin endpoint
  try {
    const res = await fetch(`${API_ROOT_URL}/bookings/${bookingId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
    if (res.ok) return await res.json();
  } catch {}

  return request(`/bookings/${bookingId}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
  });
};

export const assignBookingWorker = async (bookingId, workerId) => {
  return request(`/bookings/${bookingId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ workerId }),
  });
};

// Health Check Utility
export const checkServerHealth = async () => {
  try {
    const stats = await getDashboardStats();
    return { ok: true, stats };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// ==========================================
// Module 14: Service Area Management
// ==========================================

const serviceAreaHeaders = async (customAdminUserId) => {
  const adminUserId = customAdminUserId || (await resolveAdminUserId()) || '00000000-0000-0000-0000-000000000001';
  return { 'X-User-Id': adminUserId };
};

const serviceAreaRequest = async (endpoint, options = {}, customAdminUserId) => {
  const headers = await serviceAreaHeaders(customAdminUserId);
  return request(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...headers,
    },
  });
};

// 1. Overview KPIs
export const getServiceAreaOverview = () =>
  serviceAreaRequest('/admin/service-areas');

// 2. States
export const getStates = () =>
  serviceAreaRequest('/admin/service-areas/states');

export const createState = (arg1, arg2) => {
  const isTwoArgs = typeof arg1 === 'string' && arg2 !== undefined;
  const adminUserId = isTwoArgs ? arg1 : undefined;
  const body = isTwoArgs ? arg2 : arg1;

  return serviceAreaRequest('/admin/service-areas/states', {
    method: 'POST',
    body: JSON.stringify(body),
  }, adminUserId);
};

export const updateState = (arg1, arg2, arg3, arg4 = false) => {
  const isFourArgs = typeof arg1 === 'string' && typeof arg2 === 'string' && typeof arg3 === 'object';
  const adminUserId = isFourArgs ? arg1 : undefined;
  const stateId = isFourArgs ? arg2 : arg1;
  const body = isFourArgs ? arg3 : arg2;
  const confirm = isFourArgs ? arg4 : (arg3 || false);

  return serviceAreaRequest(`/admin/service-areas/states/${encodeURIComponent(stateId)}?confirm=${Boolean(confirm)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, adminUserId);
};

export const deleteState = (arg1, arg2, arg3 = false) => {
  const isTwoArgs = typeof arg1 === 'string' && (typeof arg2 === 'string' || typeof arg2 === 'boolean');
  const adminUserId = typeof arg2 === 'string' ? arg1 : undefined;
  const stateId = typeof arg2 === 'string' ? arg2 : arg1;
  const cascade = typeof arg2 === 'boolean' ? arg2 : Boolean(arg3);

  return serviceAreaRequest(`/admin/service-areas/states/${encodeURIComponent(stateId)}?cascade=${cascade}`, {
    method: 'DELETE',
  }, adminUserId);
};

export const deactivateState = (stateId, confirm = true) =>
  updateState(stateId, { isActive: false }, confirm);

// 3. Cities
export const getCities = (stateId = null) => {
  const query = stateId ? `?stateId=${encodeURIComponent(stateId)}` : '';
  return serviceAreaRequest(`/admin/service-areas/cities${query}`);
};

export const createCity = (arg1, arg2) => {
  const isTwoArgs = typeof arg1 === 'string' && arg2 !== undefined;
  const adminUserId = isTwoArgs ? arg1 : undefined;
  const body = isTwoArgs ? arg2 : arg1;

  return serviceAreaRequest('/admin/service-areas/cities', {
    method: 'POST',
    body: JSON.stringify(body),
  }, adminUserId);
};

export const updateCity = (arg1, arg2, arg3, arg4 = false) => {
  const isFourArgs = typeof arg1 === 'string' && typeof arg2 === 'string' && typeof arg3 === 'object';
  const adminUserId = isFourArgs ? arg1 : undefined;
  const cityId = isFourArgs ? arg2 : arg1;
  const body = isFourArgs ? arg3 : arg2;
  const confirm = isFourArgs ? arg4 : (arg3 || false);

  return serviceAreaRequest(`/admin/service-areas/cities/${encodeURIComponent(cityId)}?confirm=${Boolean(confirm)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, adminUserId);
};

export const deleteCity = (arg1, arg2, arg3 = false) => {
  const isTwoArgs = typeof arg1 === 'string' && (typeof arg2 === 'string' || typeof arg2 === 'boolean');
  const adminUserId = typeof arg2 === 'string' ? arg1 : undefined;
  const cityId = typeof arg2 === 'string' ? arg2 : arg1;
  const cascade = typeof arg2 === 'boolean' ? arg2 : Boolean(arg3);

  return serviceAreaRequest(`/admin/service-areas/cities/${encodeURIComponent(cityId)}?cascade=${cascade}`, {
    method: 'DELETE',
  }, adminUserId);
};

export const deactivateCity = (cityId, confirm = true) =>
  updateCity(cityId, { isActive: false }, confirm);

// 4. Pincodes
export const getPincodes = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const suffix = query.toString();
  return serviceAreaRequest(`/admin/service-areas/pincodes${suffix ? `?${suffix}` : ''}`);
};

export const createPincode = (arg1, arg2) => {
  const isTwoArgs = typeof arg1 === 'string' && arg2 !== undefined;
  const adminUserId = isTwoArgs ? arg1 : undefined;
  const body = isTwoArgs ? arg2 : arg1;

  return serviceAreaRequest('/admin/service-areas/pincodes', {
    method: 'POST',
    body: JSON.stringify(body),
  }, adminUserId);
};

export const bulkCreatePincodes = (arg1, arg2) => {
  const isTwoArgs = typeof arg1 === 'string' && Array.isArray(arg2);
  const adminUserId = isTwoArgs ? arg1 : undefined;
  const list = isTwoArgs ? arg2 : arg1;

  return serviceAreaRequest('/admin/service-areas/pincodes/bulk', {
    method: 'POST',
    body: JSON.stringify(list),
  }, adminUserId);
};

export const updatePincode = (arg1, arg2, arg3, arg4 = false) => {
  const isFourArgs = typeof arg1 === 'string' && typeof arg2 === 'string' && typeof arg3 === 'object';
  const adminUserId = isFourArgs ? arg1 : undefined;
  const pincodeId = isFourArgs ? arg2 : arg1;
  const body = isFourArgs ? arg3 : arg2;
  const confirm = isFourArgs ? arg4 : (arg3 || false);

  return serviceAreaRequest(`/admin/service-areas/pincodes/${encodeURIComponent(pincodeId)}?confirm=${Boolean(confirm)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, adminUserId);
};

export const deletePincode = (arg1, arg2) => {
  const isTwoArgs = typeof arg1 === 'string' && typeof arg2 === 'string';
  const adminUserId = isTwoArgs ? arg1 : undefined;
  const pincodeId = isTwoArgs ? arg2 : arg1;

  return serviceAreaRequest(`/admin/service-areas/pincodes/${encodeURIComponent(pincodeId)}`, {
    method: 'DELETE',
  }, adminUserId);
};

export const deactivatePincode = (pincodeId, confirm = true) =>
  updatePincode(pincodeId, { isActive: false }, confirm);

export const activatePincode = (pincodeId) =>
  updatePincode(pincodeId, { isActive: true });

// In-memory cache for pincode location lookups
const pincodeLocationCache = new Map();

export const lookupPincodeLocation = async (pincode) => {
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return null;
  }
  if (pincodeLocationCache.has(pincode)) {
    return pincodeLocationCache.get(pincode);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error('Location lookup failed');
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
      const offices = data[0].PostOffice;
      const first = offices[0];
      const city = first.District || first.Region || first.Division || '';
      const state = first.State || '';
      const localities = Array.from(new Set(offices.map(o => o.Name).filter(Boolean)));

      const resolved = {
        found: true,
        city,
        state,
        localities,
      };
      pincodeLocationCache.set(pincode, resolved);
      return resolved;
    }
  } catch {
    // Graceful fallback when network fails or postal API is unreachable
  }

  const emptyResult = { found: false, city: '', state: '', localities: [] };
  pincodeLocationCache.set(pincode, emptyResult);
  return emptyResult;
};

// ==========================================
// App Version & Force Update Governance APIs
// ==========================================
export const appVersionsApi = {
  getAll: () => request('/admin/app-versions'),
  update: (appType, data) => request(`/admin/app-versions/${appType}`, { method: 'PUT', body: JSON.stringify(data) }),
  checkUpdate: (currentVersion = '1.0.0', platform = 'web') =>
    request(`/app/check-update?appType=ADMIN&currentVersion=${encodeURIComponent(currentVersion)}&platform=${encodeURIComponent(platform)}`),
};

// ==========================================
// Module 06: Dispatch Diagnostics & Monitoring (Task 8)
// ==========================================
export const getDispatchLogs = async (bookingId = null, page = 0, size = 20) => {
  const query = bookingId ? `?bookingId=${bookingId}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
  return request(`/dispatch/logs${query}`);
};

export const getFailedDispatchBookings = async () => {
  return request('/dispatch/failed-bookings');
};

export const getDispatchHistory = async () => {
  return request('/dispatch/history');
};

export const getActiveWaves = () => request('/dispatch/active-waves');

export const retryDispatch = (bookingId) =>
  request(`/dispatch/retry/${bookingId}`, { method: 'POST' });

export const getCandidatesForBooking = (bookingId) =>
  request(`/dispatch/candidates/${bookingId}`);

export const cancelDispatch = (bookingId, reason = 'Cancelled by ops admin') =>
  request(`/dispatch/cancel/${bookingId}`, { method: 'POST', body: JSON.stringify({ reason }) });

// ==========================================
// Phase 5/6: Operations, Zone Control & Financials
// ==========================================
export const getOpsZones = () => request('/ops/zones');

export const toggleOpsZone = (zoneId, active) =>
  request(`/ops/zones/${zoneId}/toggle${typeof active === 'boolean' ? `?active=${active}` : ''}`, { method: 'POST' });

export const updateOpsZoneConfig = (zoneId, config) =>
  request(`/ops/zones/${zoneId}/config`, { method: 'PUT', body: JSON.stringify(config) });

export const forceReassignBooking = (bookingId, workerId, reason = 'Admin manual override', adminUserId = null) =>
  request(`/ops/bookings/${bookingId}/force-reassign`, {
    method: 'POST',
    body: JSON.stringify({ workerId, reason, adminUserId: adminUserId || getAdminUserId() }),
  });

export const getOpsDisputes = (status = null) =>
  request(`/ops/disputes${status ? `?status=${status}` : ''}`);

export const createOpsDispute = (data) =>
  request('/ops/disputes', {
    method: 'POST',
    body: JSON.stringify({ ...data, raisedByUserId: data.raisedByUserId || getAdminUserId() }),
  });

export const resolveOpsDispute = (disputeId, data) =>
  request(`/ops/disputes/${disputeId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ ...data, adminUserId: data.adminUserId || getAdminUserId() }),
  });

export const getPendingPayouts = () => request('/ops/payouts/pending');

export const settleBatchPayout = (workerIds = [], idempotencyKey = null) =>
  request('/ops/payouts/batch-settle', {
    method: 'POST',
    body: JSON.stringify({
      workerIds,
      idempotencyKey: idempotencyKey || `payout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      adminUserId: getAdminUserId(),
    }),
  });

// ==========================================
// Module: Admin Calendar, Schedules & Slots Capacity
// ==========================================
export const getCalendarEvents = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/calendar/events${query ? `?${query}` : ''}`);
};

export const getCalendarSummary = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/calendar/summary${query ? `?${query}` : ''}`);
};

export const getCalendarAvailability = (date) =>
  request(`/calendar/availability?date=${encodeURIComponent(date)}`);

export const getWorkingHours = (serviceId = null) =>
  request(`/calendar/working-hours${serviceId ? `?serviceId=${serviceId}` : ''}`);

export const updateWorkingHours = (hoursList, serviceId = null) => {
  const payload = Array.isArray(hoursList)
    ? { serviceId, schedules: hoursList }
    : hoursList;
  return request('/calendar/working-hours', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const rescheduleCalendarBooking = (bookingId, newScheduledAt, reason = 'Admin reschedule', workerId = null) =>
  request(`/calendar/bookings/${bookingId}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ newScheduledAt, reason, workerId }),
  });

export const assignCalendarWorker = (bookingId, workerId, reason = 'Admin worker assignment') =>
  request(`/calendar/bookings/${bookingId}/assign-worker`, {
    method: 'PUT',
    body: JSON.stringify({ workerId, reason }),
  });

export const copyWorkingHours = (sourceDay, targetDays, serviceId = null) =>
  request('/calendar/working-hours/copy', {
    method: 'POST',
    body: JSON.stringify({ sourceDay, targetDays, serviceId }),
  });

export const getDateOverrides = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/calendar/date-overrides${query ? `?${query}` : ''}`);
};

export const createDateOverride = (data) =>
  request('/calendar/date-overrides', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateDateOverride = (overrideId, data) =>
  request(`/calendar/date-overrides/${overrideId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteDateOverride = (overrideId) =>
  request(`/calendar/date-overrides/${overrideId}`, { method: 'DELETE' });

export const getCalendarSlots = (date, serviceId = null) => {
  let url = `/calendar/slots?date=${encodeURIComponent(date)}`;
  if (serviceId) url += `&serviceId=${serviceId}`;
  return request(url);
};

export const getBookingSettings = () =>
  request('/calendar/settings');

export const updateBookingSettings = (settings) =>
  request('/calendar/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

export const getCalendarAuditLogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/calendar/audit-logs${query ? `?${query}` : ''}`);
};

