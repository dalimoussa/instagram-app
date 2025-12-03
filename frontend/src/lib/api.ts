import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with security configurations
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
  withCredentials: false, // Set to true if using cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect to login
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, displayName: string) =>
    api.post('/auth/register', { email, password, displayName }),
  
  getProfile: () => api.get('/auth/me'),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Instagram Accounts API
export const igAccountsAPI = {
  getAll: () => api.get('/ig-accounts'),
  
  getById: (id: string) => api.get(`/ig-accounts/${id}`),
  
  getConnectUrl: () => api.get('/ig-accounts/connect'),
  
  disconnect: (id: string) => api.delete(`/ig-accounts/${id}`),
  
  refreshToken: (id: string) => api.post(`/ig-accounts/${id}/refresh`),
};

// Themes API
export const themesAPI = {
  getAll: () => api.get('/themes'),
  
  getById: (id: string) => api.get(`/themes/${id}`),
  
  create: (data: { name: string; description?: string; folderId: string }) =>
    api.post('/themes', data),
  
  update: (id: string, data: Partial<{ name: string; description?: string; folderId: string }>) =>
    api.put(`/themes/${id}`, data),
  
  delete: (id: string) => api.delete(`/themes/${id}`),
  
  getMediaAssets: (id: string) => api.get(`/themes/${id}/media`),
  
  syncMedia: (id: string) => api.post(`/themes/${id}/sync`),
};

// Schedules API
export const schedulesAPI = {
  getAll: (params?: { status?: string; startDate?: string; endDate?: string }) =>
    api.get('/schedules', { params }),
  
  getById: (id: string) => api.get(`/schedules/${id}`),
  
  create: (data: {
    name: string;
    description?: string;
    themeId: string;
    targetAccounts: string[];
    postType: 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL';
    scheduledTime: string;
    timezone?: string;
    caption?: string;
    hashtags?: string[];
    location?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
  }) => api.post('/schedules', data),
  
  update: (id: string, data: Partial<{
    name?: string;
    description?: string;
    scheduledTime?: string;
    caption?: string;
    hashtags?: string[];
    targetAccounts?: string[];
    isRecurring?: boolean;
    recurringPattern?: string;
  }>) => api.put(`/schedules/${id}`, data),
  
  cancel: (id: string) => api.delete(`/schedules/${id}`),
  
  toggle: (id: string) => api.post(`/schedules/${id}/toggle`),
  
  executeNow: (id: string) => api.post(`/schedules/${id}/execute`),
};

// Posts API
export const postsAPI = {
  getAll: (params?: { igAccountId?: string; status?: string; limit?: number; offset?: number }) =>
    api.get('/posts', { params }),
  
  getById: (id: string) => api.get(`/posts/${id}`),
  
  retry: (id: string) => api.post(`/posts/${id}/retry`),
  
  delete: (id: string) => api.delete(`/posts/${id}`),
};

// Insights API
export const insightsAPI = {
  getAccountInsights: (igAccountId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/insights/account/${igAccountId}`, { params }),
  
  getPostInsights: (postId: string) => api.get(`/insights/post/${postId}`),
  
  syncInsights: (igAccountId: string) => api.post(`/insights/sync/${igAccountId}`),
};

// Licenses API
export const licensesAPI = {
  getStatus: () => api.get('/licenses/status'),
  
  validate: (email: string) => api.get(`/licenses/validate`, { params: { email } }),
  
  activate: (email: string, licenseKey: string) => 
    api.post('/licenses/activate', { email, licenseKey }),
  
  sync: () => api.post('/licenses/sync'),
};

// Settings API (Admin Only)
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  
  updateSettings: (data: {
    instagramAppId?: string;
    instagramAppSecret?: string;
    instagramRedirectUri?: string;
    instagramApiVersion?: string;
    publicUrl?: string;
    cloudinaryCloudName?: string;
    cloudinaryApiKey?: string;
    cloudinaryApiSecret?: string;
  }) => api.put('/settings', data),
  
  restartServer: () => api.post('/settings/restart'),
  
  getStatus: () => api.get('/settings/status'),
};
