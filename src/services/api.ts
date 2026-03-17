// frontend/src/services/api.ts

import axios from 'axios';
import logger from '../utils/logger';
import { API_CONFIG, ERROR_MESSAGES } from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // CRITICAL: Send cookies with every request
  timeout: API_CONFIG.TIMEOUT,
});

api.interceptors.request.use((config) => {
  logger.api(config.method || 'GET', config.url || '', {
    params: config.params,
    hasData: Boolean(config.data),
  });
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    logger.debug('API', `Response from ${response.config.url}`, {
      status: response.status,
    });
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    const status = error.response?.status;

    logger.apiError(error.config?.method || 'GET', url, error);

    // On 401: dispatch a session-expired event instead of a hard redirect.
    // AuthContext listens for this event and shows the SessionExpiredModal.
    // Exception: /auth/me endpoint — a 401 there just means "not logged in" (initial load).
    // BUG FIX: Only trigger session expiry if the 401 came from an `/admin/` route!
    // Some dashboard components might query `/videos` or `/content` which expect
    // Bearer user tokens and will return 401 for cookie-only admins. We should NOT
    // log the admin out if a random video query fails auth.
    const isAdminRoute = url.includes('/admin/');
    if (status === 401 && !url.includes('/auth/me') && isAdminRoute) {
      logger.warn('API', '401 Unauthorized on Admin route — dispatching session-expired event');
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }

    // Enhance error with user-friendly message
    if (!error.response) {
      error.userMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (status === 401) {
      error.userMessage = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (status === 403) {
      error.userMessage = ERROR_MESSAGES.FORBIDDEN;
    } else if (status === 404) {
      error.userMessage = ERROR_MESSAGES.NOT_FOUND;
    } else if (status && status >= 500) {
      error.userMessage = ERROR_MESSAGES.SERVER_ERROR;
    } else {
      error.userMessage = error.response?.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export async function sendOTP(email: string) {
  const res = await api.post('/admin/auth/send-otp', { email });
  return res.data;
}

export async function verifyOTP(email: string, otp: string) {
  const res = await api.post('/admin/auth/verify-otp', { email, otp });
  return res.data;
}

export async function getCurrentAdmin() {
  const res = await api.get('/admin/auth/me');
  return res.data;
}

export async function logout() {
  const res = await api.post('/admin/auth/logout');
  return res.data;
}


// Role Management APIs
export const getAllAdmins = () => {
  return api.get('/roles');
};

export const createAdmin = (data: {
  email: string;
  role: 'admin' | 'manager';
  permissions: { read: boolean; write: boolean; delete: boolean };
}) => {
  return api.post('/roles', data);
};

export const updateAdmin = (
  adminId: string,
  data: {
    role?: 'admin' | 'manager';
    permissions?: { read: boolean; write: boolean; delete: boolean };
    isActive?: boolean;
  }
) => {
  return api.put(`/roles/${adminId}`, data);
};

export const deleteAdmin = (adminId: string) => {
  return api.delete(`/roles/${adminId}`);
};


// // Role Management APIs
// export async function createAdmin(data: {
//   email: string;
//   role: 'admin' | 'manager';
//   permissions: { read: boolean; write: boolean; delete: boolean };
// }) {
//   const res = await api.post('/admin/roles', data);
//   return res.data;
// }

// export async function getAllAdmins() {
//   const res = await api.get('/admin/roles');
//   return res.data;
// }

// export async function updateAdmin(
//   adminId: string,
//   data: {
//     role?: 'admin' | 'manager';
//     permissions?: { read: boolean; write: boolean; delete: boolean };
//     isActive?: boolean;
//   }
// ) {
//   const res = await api.put(`/admin/roles/${adminId}`, data);
//   return res.data;
// }

// export async function deleteAdmin(adminId: string) {
//   const res = await api.delete(`/admin/roles/${adminId}`);
//   return res.data;
// }

// Video Management APIs
export async function uploadVideo(
  formData: FormData,
  onUploadProgress?: (event: ProgressEvent) => void
) {
  const res = await api.post('/admin/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return res.data;
}

export async function getAllVideos(filters?: {
  type?: 'reel' | 'episode';
  status?: string;
  seasonId?: string;
}) {
  const res = await api.get('/admin/videos', { params: filters });
  return res.data;
}

export async function updateVideo(
  videoId: string,
  data: { title?: string; description?: string; isPublished?: boolean } | FormData
) {
  // Check if data is FormData (for thumbnail upload) or regular object
  const isFormData = data instanceof FormData;
  const res = await api.put(`/admin/videos/${videoId}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return res.data;
}

export async function getVideoAnalytics(filters?: {
  filter?: 'views' | 'comments' | 'likes' | 'coin_unlocks' | 'ad_unlocks' | 'total_unlocks';
  sort?: 'asc' | 'desc';
  limit?: number;
  type?: 'reel' | 'episode' | 'series';
}) {
  const res = await api.get('/admin/videos/analytics', { params: filters });
  return res.data;
}

export async function getVideoDetailedAnalytics(videoId: string) {
  const res = await api.get(`/admin/videos/${videoId}/analytics`);
  return res.data;
}

export async function updateVideoAdStatus(
  videoId: string,
  adStatus: 'unlocked' | 'interstitial' | 'rewarded' | 'rewarded_interstitial'
) {
  const res = await api.patch(
    `/admin/videos/${videoId}/ad-status`,
    { adStatus }
  );
  return res.data;
}

export async function updateVideoSequentialLock(videoId: string, sequentialLock: boolean) {
  const res = await api.patch(
    `/admin/videos/${videoId}/sequential-lock`,
    { sequentialLock }
  );
  return res.data;
}

export async function deleteVideo(videoId: string) {
  const res = await api.delete(`/admin/videos/${videoId}`);
  return res.data;
}

// // Season Management APIs
// export async function createSeason(data: {
//   title: string;
//   description?: string;
//   seasonNumber: number;
//   thumbnail?: string;
// }) {
//   const res = await api.post('/admin/videos/seasons', data);
//   return res.data;
// }

// export async function getAllSeasons() {
//   const res = await api.get('/admin/videos/seasons');
//   return res.data;
// }

// ========== Season Management ==========
export const getAllSeasons = () => api.get('/videos/seasons');

export const getSeasonById = (seasonId: string) =>
  api.get(`/videos/seasons/${seasonId}`);

export const createSeason = (formData: FormData) =>
  api.post('/videos/seasons', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateSeason = (seasonId: string, formData: FormData) =>
  api.put(`/videos/seasons/${seasonId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const toggleSeasonPublish = (seasonId: string, isActive: boolean) =>
  api.put(`/videos/seasons/${seasonId}`, { isActive });

export const deleteSeason = (seasonId: string) =>
  api.delete(`/videos/seasons/${seasonId}`);

// ========== Video/Episode Management ==========
// export const getAllVideos = (params?: {
//   type?: 'reel' | 'episode';
//   status?: string;
//   seasonId?: string;
// }) => api.get('/videos', { params });

export const getVideoById = (videoId: string) =>
  api.get(`/videos/${videoId}`);

export const getEpisodesBySeason = (seasonId: string) =>
  api.get(`/content/episodes/${seasonId}`);

export const getEpisodesBySeasonAdmin = async (seasonId: string) => {
  const response = await api.get('/videos', {
    params: { seasonId, type: 'episode' }
  });
  return response.data;
};

export const publishAllEpisodes = (seasonId: string) =>
  api.put(`/videos/seasons/${seasonId}/publish-all`);
// export const uploadVideo = (formData: FormData) => 
//   api.post('/videos', formData, {
//     headers: { 'Content-Type': 'multipart/form-data' }
//   });

// export const updateVideo = (videoId: string, data: any) => 
//   api.put(`/videos/${videoId}`, data);

// export const deleteVideo = (videoId: string) => 
//   api.delete(`/videos/${videoId}`);
// Web Series / Season APIs (from WebSeriesPage)

export const createEpisode = (seasonId: string, data: FormData) => api.post(`/seasons/${seasonId}/episodes`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Carousel Management APIs
export const getAllCarouselItems = () => api.get('/carousel');
export const getActiveCarouselItems = () => api.get('/carousel/active');
export const createCarouselItem = (data: FormData) => api.post('/carousel', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateCarouselItem = (id: string, data: FormData) => api.put(`/carousel/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteCarouselItem = (id: string) => api.delete(`/carousel/${id}`);
export const reorderCarouselItems = (items: { id: string; order: number }[]) => api.put('/carousel/reorder', { items });

// ──────────────────────────────────────────────────────────────────────────────
// FCM Campaigns
export const createFcmCampaign = (data: {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  data?: Record<string, string>;
  priority?: 'normal' | 'high';
  targetType: 'all_users' | 'by_user_ids' | 'by_tokens';
  userIds?: string[];
  tokens?: string[];
}) => api.post('/notifications/campaigns', data);

export const getFcmCampaigns = (params?: { page?: number; limit?: number }) =>
  api.get('/notifications/campaigns', { params });

// In-App (non-FCM) Notifications (admin-only)
export const getInAppBroadcastHistory = (params?: { page?: number; limit?: number }) =>
  api.get('/admin/notifications/broadcast/history', {
    params: { page: params?.page ?? 1, limit: params?.limit ?? 100, _: Date.now() },
  });

export const uploadNotificationImage = (formData: FormData) =>
  api.post('/admin/notifications/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const setActiveBanner = (data: {
  title: string;
  message: string;
  imageUrl?: string;
  actionLabel?: string;
  actionRoute?: string;
}) =>
  api.post('/admin/notifications/banner', {
    title: data.title,
    message: data.message,
    imageUrl: data.imageUrl,
    action:
      data.actionLabel && data.actionRoute
        ? { label: data.actionLabel, route: data.actionRoute }
        : undefined,
  });

export const disableActiveBanner = () => api.delete('/admin/notifications/banner');

export const showBannerFromLog = (logId: string) =>
  api.post(`/admin/notifications/banner/show/${logId}`);

export const deleteBroadcastLog = (logId: string) =>
  api.delete(`/admin/notifications/broadcast/history/${logId}`);

export const getActiveBanners = () => api.get('banner');

export const disableBannerById = (bannerId: string) =>
  api.delete(`/admin/notifications/banner/${bannerId}`);

export const sendInAppBroadcastNotification = (data: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'promo' | 'banner';
  imageUrl?: string;
  actionLabel?: string;
  actionRoute?: string;
  extraData?: Record<string, any>;
}) =>
  api.post('/admin/notifications/broadcast', {
    title: data.title,
    message: data.message,
    type: data.type,
    imageUrl: data.imageUrl,
    data: data.extraData,
    action:
      data.actionLabel && data.actionRoute
        ? {
            label: data.actionLabel,
            route: data.actionRoute,
          }
        : undefined,
  });

// ---- Automated / General Notifications (frontend stubs) ----
// These help the existing pages compile and can be wired to real
// backend endpoints when available.

export const getSchedulerStatus = async () =>
  Promise.resolve({
    data: {
      isInitialized: false,
      registrationReminders: '19:00',
      startNotifications: '*/15 * * * *',
      timezone: 'UTC',
    },
  });

export const triggerRegistrationReminders = async () =>
  Promise.resolve({ data: { success: true } });

export const triggerStartNotifications = async () =>
  Promise.resolve({ data: { success: true } });

export const getUpcomingNotifications = async () =>
  Promise.resolve({
    data: {
      summary: { totalRegistrationReminders: 0, totalStartNotifications: 0 },
      registrationReminders: {},
      startNotifications: {},
    },
  });

export const getNotificationStats = async () =>
  Promise.resolve({
    data: {
      tomorrow: { registrationEnding: { events: 0, hackathons: 0, quizzes: 0, total: 0 } },
      thisWeek: { starting: { events: 0, hackathons: 0, quizzes: 0, total: 0 } },
      scheduler: { isInitialized: false, registrationReminders: '', startNotifications: '', timezone: 'UTC' },
    },
  });

// Send a general notification by leveraging the FCM campaign endpoint
export const sendGeneralNotification = (data: {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  link?: string;
}) =>
  createFcmCampaign({
    title: data.title,
    body: data.body,
    imageUrl: data.image,
    deepLink: data.link,
    data: data.data,
    targetType: 'all_users',
  });

// Cashfree Revenue Analytics APIs
export async function getCashfreeRevenueAnalytics(filters?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'month' | 'year';
}) {
  const res = await api.get('/admin/analytics/cashfree', { params: filters });
  return res.data;
}

export async function getCashfreeTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed';
}) {
  const res = await api.get('/admin/analytics/cashfree/transactions', { params: filters });
  return res.data;
}

// User Management APIs
export async function getAllUsers(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'blocked' | 'comment_banned';
}) {
  const res = await api.get('/admin/users', { params: filters });
  return res.data;
}

export async function getUserById(userId: string) {
  const res = await api.get(`/admin/users/${userId}`);
  return res.data;
}

export async function banUser(userId: string, banType: 'partial' | 'complete', reason?: string) {
  const res = await api.post(`/admin/users/${userId}/ban`, { banType, reason });
  return res.data;
}

export async function unbanUser(userId: string, banType?: 'partial' | 'complete') {
  const res = await api.post(`/admin/users/${userId}/unban`, banType ? { banType } : {});
  return res.data;
}

export async function updateUserStatus(userId: string, data: { isActive?: boolean; isBlocked?: boolean }) {
  const res = await api.patch(`/admin/users/${userId}/status`, data);
  return res.data;
}

// Dashboard Analytics API
export async function getDashboardAnalytics() {
  const res = await api.get('/admin/dashboard/analytics');
  return res.data;
}

export default api;