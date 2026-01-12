// frontend/src/services/api.ts

import axios from 'axios';

const enableApiDebug = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGS === 'true';
const logApi = (...args: any[]) => {
  if (enableApiDebug) {
    console.log('[API]', ...args);
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // CRITICAL: Send cookies with every request
});

api.interceptors.request.use((config) => {
  logApi('Request', {
    method: config.method,
    url: config.url,
    params: config.params,
    hasData: Boolean(config.data),
  });
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    logApi('Response', {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  (error) => {
    logApi('Error', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    // Only redirect to login if it's NOT the /me endpoint
    // This prevents redirect loop during initial auth check
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/me')) {
      console.log('API: 401 error, redirecting to login');
      window.location.href = '/login';
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
export async function uploadVideo(formData: FormData) {
  const res = await api.post('/admin/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
  adStatus: 'locked' | 'unlocked'
) {
  const res = await api.patch(
    `/admin/videos/${videoId}/ad-status`,
    { adStatus }
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

// Auth APIs (if needed)
export const login = (credentials: { email: string; password: string }) => api.post('/auth/login', credentials);

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