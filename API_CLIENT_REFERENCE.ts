"""
Frontend API Client - TypeScript version
This file should be placed in frontend-react/src/utils/api.ts
"""

import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Store tokens in localStorage
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AnalysisResult {
  issues: string[];
  complexity: string;
  improved_code: string;
  explanation: string;
  ai_provider: string;
  quality_metrics: Record<string, any>;
}

interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If 401 and not a retry attempt
    if (error.response?.status === 401 && originalRequest && !originalRequest.headers['retry-attempt']) {
      originalRequest.headers['retry-attempt'] = 'true';

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post<TokenResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data;
        localStorage.setItem(TOKEN_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Client Functions

export const authAPI = {
  register: async (email: string, username: string, password: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email,
      password,
    });

    const { access_token, refresh_token } = response.data;
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);

    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
};

export const codeAPI = {
  analyze: async (
    code: string,
    language: string,
    aiProvider: string = 'ollama'
  ): Promise<AnalysisResult> => {
    const response = await apiClient.post<AnalysisResult>('/analyze', {
      code,
      language,
      ai_provider: aiProvider,
    });
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  getTrends: async (hours: number = 24) => {
    const response = await apiClient.get('/analytics/trends', {
      params: { hours },
    });
    return response.data;
  },

  export: async (analysisResult: AnalysisResult, format: string) => {
    const response = await apiClient.post(`/export/${format}`, analysisResult);
    return response.data;
  },
};

export const projectAPI = {
  create: async (name: string, description?: string, isPublic: boolean = false) => {
    const response = await apiClient.post('/projects', {
      name,
      description,
      is_public: isPublic,
    });
    return response.data;
  },

  list: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  get: async (projectId: number) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  },

  getAnalyses: async (projectId: number) => {
    const response = await apiClient.get(`/projects/${projectId}/analyses`);
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || error.message;
    toast.error(typeof message === 'string' ? message : 'An error occurred');
    return typeof message === 'string' ? message : 'An error occurred';
  }
  toast.error('An unexpected error occurred');
  return 'An unexpected error occurred';
};

export default apiClient;
