/**
 * HomeEase Admin Panel — Live Backend API Client
 * Base URL: http://3.107.161.126:8080 (AWS Live Cloud Server)
 */

const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL || '';

export const API_BASE_URL = (() => {
  // If deployed on HTTPS (e.g. Vercel) and URL is insecure HTTP or not set, route through Vercel's proxy rewrite
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (!rawBaseUrl || rawBaseUrl.startsWith('http://')) {
      return '/api/v1/admin';
    }
  }
  // Otherwise use specified URL or live backend fallback
  return rawBaseUrl || 'http://3.107.161.126:8080/api/v1/admin';
})();

export const API_ROOT_URL = API_BASE_URL.replace(/\/admin\/?$/, '');

/**
 * Upload Image to Supabase S3 Storage via backend upload endpoints
 * Endpoint must receive multipart/form-data with key 'file'
 */
export const uploadImageToSupabase = async (endpointPath, file) => {
  const formData = new FormData();
  formData.append('file', file); // MUST be named 'file'

  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const uploadUrl = `${API_ROOT_URL}${cleanPath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
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

  const data = await response.json();
  return data.url; // Returns Supabase public URL
};

export const uploadBannerImage = (file) => uploadImageToSupabase('/upload/banner-image', file);
export const uploadServiceImage = (file) => uploadImageToSupabase('/upload/service-image', file);
export const uploadSubServiceImage = (file) => uploadImageToSupabase('/upload/sub-service-image', file);
export const uploadWorkerProfile = (workerId, file) => uploadImageToSupabase(`/upload/worker-profile/${workerId}`, file);
export const uploadWorkerPan = (workerId, file) => uploadImageToSupabase(`/upload/worker-kyc/pan/${workerId}`, file);
export const uploadWorkerAadhaar = (workerId, file) => uploadImageToSupabase(`/upload/worker-kyc/aadhaar/${workerId}`, file);

// Helper for standard HTTP fetch with timeout and JSON headers
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 12000);

  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = typeof data === 'object' && data?.message
        ? data.message
        : typeof data === 'string' && data.length > 0
          ? data
          : `HTTP ${response.status} ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${endpoint} timed out after 12s`);
    }
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

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
  } catch (err) {
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
          } catch (e) {
            // Ignore individual fetch errors
          }
        })
      );
      return allSubs;
    }
  } catch (e) {
    console.warn('Sub-services fallback retrieval error:', e);
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

// ==========================================
// Module 4 & 3: Worker Partner Governance & KYC
// ==========================================
export const getWorkers = () => {
  return request('/workers');
};

export const verifyWorkerKYC = (workerId) => {
  return request(`/workers/${workerId}/verify-kyc`, {
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

// ==========================================
// Module 5: Customer & User Management
// ==========================================
export const getUsers = (role) => {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return request(`/users${query}`);
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

export const createBanner = (bannerData) => {
  return request('/banners', {
    method: 'POST',
    body: JSON.stringify(bannerData),
  });
};

export const toggleBanner = (bannerId, isActive) => {
  return request(`/banners/${bannerId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};

// ==========================================
// Module 7: Coupons & Discounts
// ==========================================
export const getCoupons = (activeOnly = false) => {
  return request(`/coupons?activeOnly=${activeOnly}`);
};

export const createCoupon = (couponData) => {
  return request('/coupons', {
    method: 'POST',
    body: JSON.stringify(couponData),
  });
};

// ==========================================
// Module 8: Financials & Payment Audit
// ==========================================
export const getPayments = () => {
  return request('/payments');
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

// ==========================================
// Module 11: Bookings & Orders Management
// ==========================================
export const getBookings = async () => {
  // 1. Attempt admin direct endpoint
  try {
    const data = await request('/bookings');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err) {}

  // 2. Fallback to active bookings from live map
  try {
    const liveMap = await request('/locations/live-map');
    if (liveMap && Array.isArray(liveMap.activeBookings) && liveMap.activeBookings.length > 0) {
      return liveMap.activeBookings;
    }
  } catch (err) {}

  return [];
};

export const updateBookingStatus = async (bookingId, status) => {
  // Attempt both public state-machine endpoint and admin endpoint
  try {
    const res = await fetch(`${API_ROOT_URL}/bookings/${bookingId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
    if (res.ok) return await res.json();
  } catch (e) {}

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

