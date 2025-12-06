// frontend/src/services/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // CRITICAL: Send cookies with every request
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
export async function createAdmin(data: {
  email: string;
  role: 'admin' | 'manager';
  permissions: { read: boolean; write: boolean; delete: boolean };
}) {
  const res = await api.post('/admin/roles', data);
  return res.data;
}

export async function getAllAdmins() {
  const res = await api.get('/admin/roles');
  return res.data;
}

export async function updateAdmin(
  adminId: string,
  data: {
    role?: 'admin' | 'manager';
    permissions?: { read: boolean; write: boolean; delete: boolean };
    isActive?: boolean;
  }
) {
  const res = await api.put(`/admin/roles/${adminId}`, data);
  return res.data;
}

export async function deleteAdmin(adminId: string) {
  const res = await api.delete(`/admin/roles/${adminId}`);
  return res.data;
}

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
  data: { title?: string; description?: string; isPublished?: boolean }
) {
  const res = await api.put(`/admin/videos/${videoId}`, data);
  return res.data;
}

export async function deleteVideo(videoId: string) {
  const res = await api.delete(`/admin/videos/${videoId}`);
  return res.data;
}

// Season Management APIs
export async function createSeason(data: {
  title: string;
  description?: string;
  seasonNumber: number;
  thumbnail?: string;
}) {
  const res = await api.post('/admin/videos/seasons', data);
  return res.data;
}

export async function getAllSeasons() {
  const res = await api.get('/admin/videos/seasons');
  return res.data;
}

export default api;