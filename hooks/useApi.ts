"use client"

import { useEffect, useState } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// Define API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Create a custom error type for API errors
class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create a type-safe API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create a type-safe API hook
export function useApi() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Clear error state when component mounts
  useEffect(() => {
    setError(null);
  }, []);

  // Generic request handler
  const request = async <T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.request({
        method,
        url: endpoint,
        data,
        params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as AxiosError;
      setError(apiError.response?.data?.error || apiError.message);
      throw new ApiError(
        apiError.response?.data?.error || apiError.message,
        apiError.response?.status,
        apiError.response?.data
      );
    } finally {
      // Clear error state after request
      setError(null);
    }
  };

  // CRUD methods
  const get = async <T>(endpoint: string, params?: any): Promise<ApiResponse<T>> => {
    return request('GET', endpoint, undefined, params);
  };

  const post = async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    return request('POST', endpoint, data);
  };

  const put = async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    return request('PUT', endpoint, data);
  };

  const del = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return request('DELETE', endpoint);
  };

  // File upload
  const uploadFile = async (file: File, endpoint: string): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const apiError = error as AxiosError;
      setError(apiError.response?.data?.error || apiError.message);
      throw new ApiError(
        apiError.response?.data?.error || apiError.message,
        apiError.response?.status,
        apiError.response?.data
      );
    }
  };

  return {
    get,
    post,
    put,
    del,
    uploadFile,
    error,
  };
}
