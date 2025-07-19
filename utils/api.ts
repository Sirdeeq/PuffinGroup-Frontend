"use client"

import axios, { type AxiosError } from "axios"
import type { AdminDashboardResponse, DirectorDashboardResponse, DepartmentDashboardResponse } from "@/types/dashboard"
import type { useAuth } from "@/contexts/AuthContext"

// User interface
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "director" | "department"
  department?: string
  position?: string
  avatar?: string
}

// Define API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://puffingroup-backend.onrender.com"
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://puffingroup-backend-1.onrender.com"
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://puffingroup-backend-2.onrender.com"

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for file uploads
})

// Add a request interceptor to add the auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    } else {
      config.headers["Content-Type"] = "application/json"
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error("API Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    })
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

// Create a custom error type for API errors
class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public data?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Create a type-safe API client
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class ApiClient {
  private static instance: ApiClient

  private constructor() { }

  // Singleton pattern to ensure only one instance
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  // Generic request handler
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: any,
    authContext?: ReturnType<typeof useAuth>,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.request({
        method,
        url: endpoint,
        data,
        params,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      const apiError = error as AxiosError
      const errorMessage =
        (apiError.response?.data as any)?.message ||
        (apiError.response?.data as any)?.error ||
        apiError.message ||
        "An error occurred"
      throw new ApiError(errorMessage, apiError.response?.status, apiError.response?.data)
    }
  }

  // CRUD methods
  public async get<T>(
    endpoint: string,
    params?: any,
    authContext?: ReturnType<typeof useAuth>,
  ): Promise<ApiResponse<T>> {
    return this.request("GET", endpoint, undefined, params, authContext)
  }

  public async post<T>(endpoint: string, data: any, authContext?: ReturnType<typeof useAuth>): Promise<ApiResponse<T>> {
    return this.request("POST", endpoint, data, undefined, authContext)
  }

  public async put<T>(endpoint: string, data: any, authContext?: ReturnType<typeof useAuth>): Promise<ApiResponse<T>> {
    return this.request("PUT", endpoint, data, undefined, authContext)
  }

  public async delete<T>(endpoint: string, authContext?: ReturnType<typeof useAuth>): Promise<ApiResponse<T>> {
    return this.request("DELETE", endpoint, undefined, undefined, authContext)
  }

  // File upload method with FormData support
  public async uploadFormData<T>(
    endpoint: string,
    formData: FormData,
    authContext?: ReturnType<typeof useAuth>,
  ): Promise<ApiResponse<T>> {
    try {
      console.log("Uploading FormData to:", endpoint)
      // Log FormData contents for debugging
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`FormData ${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type,
          })
        } else {
          console.log(`FormData ${key}:`, value)
        }
      }

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        timeout: 60000, // 60 seconds for file uploads
      })

      console.log("Upload response:", response.data)
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      const apiError = error as AxiosError
      console.error("Upload error:", {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message,
      })
      const errorMessage =
        (apiError.response?.data as any)?.message ||
        (apiError.response?.data as any)?.error ||
        apiError.message ||
        "Upload failed"
      throw new ApiError(errorMessage, apiError.response?.status, apiError.response?.data)
    }
  }

  // Download file method
  public async downloadFile<T>(
    endpoint: string,
    params?: any,
    authContext?: ReturnType<typeof useAuth>,
  ): Promise<ApiResponse<Blob>> {
    try {
      const response = await apiClient.get(endpoint, {
        params,
        responseType: "blob",
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      const apiError = error as AxiosError
      throw new ApiError(
        (apiError.response?.data as any)?.message || apiError.message,
        apiError.response?.status,
        apiError.response?.data,
      )
    }
  }
}

// Create a simple API service that uses the ApiClient
export const api = {
  // Authentication
  login: async (credentials: { email: string; password: string }) => {
    const response = await ApiClient.getInstance().post("/api/auth/login", credentials)
    return response
  },

  // User registration
  registerUser: async (userData: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/auth/register", userData, authContext)
  },

  registerDirector: async (userData: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/auth/register-director", userData, authContext)
  },

  registerDepartmentUser: async (userData: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/auth/department/register", userData, authContext)
  },

  getDepartmentUsers: async (authContext: any) => {
    return ApiClient.getInstance().get("/api/auth/department/users", undefined, authContext)
  },

  registerUserUnderDepartment: async (userData: any, authContext: any) => {
    return ApiClient.getInstance().post("/api/auth/department/register", userData, authContext)
  },

  updateDepartmentUser: async (userId: string, userData: any, authContext: any) => {
    return ApiClient.getInstance().put(`/api/auth/department/users/${userId}`, userData, authContext)
  },

  changeDepartmentUserPassword: async (userId: string, passwordData: any, authContext: any) => {
    return ApiClient.getInstance().put(`/api/auth/department/users/${userId}/password`, passwordData, authContext)
  },

  toggleDepartmentUserStatus: async (userId: string, statusData: any, authContext: any) => {
    return ApiClient.getInstance().put(`/api/auth/department/users/${userId}/status`, statusData, authContext)
  },

  deleteDepartmentUser: async (userId: string, authContext: any) => {
    return ApiClient.getInstance().delete(`/api/auth/department/users/${userId}`, authContext)
  },

  // User management
  getUser: async (authContext: ReturnType<typeof useAuth>) => {
    const response = await ApiClient.getInstance().get<User>("/api/auth/me", undefined, authContext)
    return response
  },

  getUsers: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/users", undefined, authContext)
  },

  getUsersByRole: async (role: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/users/role/${role}`, undefined, authContext)
  },

  // Check if user has signature
  getUserSignature: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/auth/signature", undefined, authContext)
  },

  updateUserSignature<T = any>(data: T, authContext: ReturnType<typeof useAuth>): Promise<ApiResponse<T>> {
    return ApiClient.getInstance().put(`/api/auth/signature`, data, authContext)
  },

  updateUser: async (id: string, data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/users/${id}`, data, authContext)
  },

  updateUseravatar: async (id: string, data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/users/${id}/avatar`, data, authContext)
  },

  deleteUser: async (id: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().delete(`/api/users/${id}`, authContext)
  },

  updateProfile: async (data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put("/api/auth/profile", data, authContext)
  },

  changePassword: async (data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put("/api/auth/password", data, authContext)
  },

  resetUserPassword: async (userId: string, data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/users/${userId}/reset-password`, data, authContext)
  },

  toggleUserStatus: async (userId: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/users/${userId}/toggle-status`, undefined, authContext)
  },

  // Dashboard
  getAdminDashboardStats: async (
    authContext: ReturnType<typeof useAuth>,
  ): Promise<ApiResponse<AdminDashboardResponse>> => {
    return ApiClient.getInstance().get<AdminDashboardResponse>("/api/admin/dashboard", undefined, authContext)
  },

  getDirectorDashboardStats: async (
    authContext: ReturnType<typeof useAuth>,
  ): Promise<ApiResponse<DirectorDashboardResponse>> => {
    return ApiClient.getInstance().get<DirectorDashboardResponse>(
      "/api/admin/director/dashboard",
      undefined,
      authContext,
    )
  },

  getDepartmentDashboardStats: async (
    id: string,
    authContext: ReturnType<typeof useAuth>,
  ): Promise<ApiResponse<DepartmentDashboardResponse>> => {
    return ApiClient.getInstance().get<DepartmentDashboardResponse>(
      `/api/admin/departments/${id}/stats`,
      undefined,
      authContext,
    )
  },

  // Departments
  getDepartments: async (params?: { includeInactive?: boolean }, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/departments", params, authContext)
  },

  createDepartment: async (data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/departments", data, authContext)
  },

  getUnassignedDirectors: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/users/directors/unassigned", undefined, authContext)
  },

  // Get all directors
  getAllDirectors: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/users/directors", undefined, authContext)
  },

  // Assign director to department
  assignDirectorToDepartment: async (
    departmentId: string,
    directorId: string,
    authContext: ReturnType<typeof useAuth>,
  ) => {
    return ApiClient.getInstance().put(`/api/departments/${departmentId}/assign-director`, { directorId }, authContext)
  },

  updateDepartment: async (id: string, data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/departments/${id}`, data, authContext)
  },

  uploadNewVersion: async (id: string, formData: FormData, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().uploadFormData(`/api/files/${id}/version`, formData, authContext)
  },

  // Add these methods to your api object in api.ts

  // Folder operations
  getFolders: async (params?: {
    parentId?: string;
    type?: "public" | "private";
  }, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/folders", params, authContext);
  },

  getFolder: async (id: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/structure/folders/${id}`, undefined, authContext);
  },

  createFolder: async (data: {
    name: string;
    description?: string;
    departments?: string[];
    accessLevel?: "public" | "department" | "private";
    parentFolderId?: string;
    isPublic?: boolean;
  }, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/structure/folders", data, authContext);
  },

  updateFolder: async (id: string, data: {
    name?: string;
    description?: string;
    departments?: string[];
    accessLevel?: "public" | "department" | "private";
  }, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/structure/folders/${id}`, data, authContext);
  },

  deleteFolder: async (id: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().delete(`/api/structure/folders/${id}`, authContext);
  },

  shareFolder: async (id: string, data: {
    departments?: string[];
    users?: string[];
    permission?: "view" | "edit" | "full";
    message?: string;
  }, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post(`/api/structure/folders/${id}/share`, data, authContext);
  },

  getFolderBreadcrumb: async (id: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/structure/folders/${id}/breadcrumb`, undefined, authContext);
  },

  initializeFolderStructure: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/structure/initialize-structure", undefined, authContext);
  },

  getFolderFiles: async (id: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/structure/folders/${id}/files`, undefined, authContext);
  },

  // File operations
  getFiles: async (params?: {
    status?: string;
    department?: string;
    category?: string;
    folderId?: string
  }, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/files", params, authContext);
  },

  getFile: async (id: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/structure/files/${id}`, undefined, authContext);
  },

  createFile: async (formData: FormData, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().uploadFormData("/api/structure/file", formData, authContext);
  },

  updateFile: async (id: string, data: any, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/structure/file/${id}`, data, authContext);
  },

  deleteFile: async (id: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().delete(`/api/structure/file/${id}`, authContext);
  },

  shareFile: async (id: string, shareData: any, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post(`/api/structure/file/${id}/share`, shareData, authContext);
  },

  moveFile: async (fileId: string, folderId: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/structure/file/${fileId}/move`, { folderId }, authContext);
  },

  // Special file retrieval
  getFilesByDepartment: async (departmentId: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/structure/departments/${departmentId}/files`, undefined, authContext);
  },

  getFilesForAdmin: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/admin/files", undefined, authContext);
  },

  getFilesForDirector: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/director/files", undefined, authContext);
  },

  getSharedFiles: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/shared-files", undefined, authContext);
  },

  getInboxFiles: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/inbox/files", undefined, authContext);
  },

  getInboxFolders: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/inbox/folders", undefined, authContext);
  },

  // Notification operations
  getNotifications: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/structure/notifications", undefined, authContext);
  },

  markNotificationAsRead: async (notificationId: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/structure/notifications/${notificationId}/read`, undefined, authContext);
  },

  getBreadcrumbPath: async (id: string, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/structure/folders/${id}/breadcrumb`, undefined, authContext);
  },


  // Requests
  createRequest: async (data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/requests", data, authContext)
  },

  getRequests: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/requests", undefined, authContext)
  },

  getIncomingRequests: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/requests/incoming", undefined, authContext)
  },

  getRequest: async (id: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/requests/${id}`, undefined, authContext)
  },

  getReviewedRequests: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/requests/reviewed", undefined, authContext)
  },

  updateRequest: async (id: string, data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/requests/${id}`, data, authContext)
  },

  deleteRequest: async (id: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().delete(`/api/requests/${id}`, authContext)
  },

  takeRequestAction: async (id: string, actionData: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/requests/${id}/action`, actionData, authContext)
  },

  submitSignature: async (id: string, signatureData: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post(`/api/requests/${id}/signature`, signatureData, authContext)
  },

  addRequestComment: async (id: string, commentData: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post(`/api/requests/${id}/comments`, commentData, authContext)
  },

  getDirectorsByDepartment: async (departmentId: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/departments/${departmentId}/directors`, undefined, authContext)
  },

  // Reports
  createReport: async (data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/reports", data, authContext)
  },

  getReports: async (authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/reports", undefined, authContext)
  },

  getReport: async (id: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get(`/api/reports/${id}`, undefined, authContext)
  },

  updateReport: async (id: string, data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/reports/${id}`, data, authContext)
  },

  deleteReport: async (id: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().delete(`/api/reports/${id}`, authContext)
  },

  getReportData: async (params: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/reports/data", params, authContext)
  },

  generateReport: async (params: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().downloadFile("/api/reports/generate", params, authContext)
  },

  // Attendance
  checkIn: async (data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/attendance/check-in", data, authContext)
  },

  checkOut: async (data: any, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().post("/api/attendance/check-out", data, authContext)
  },

  getAttendanceHistory: async (params?: any, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/attendance/history", params, authContext)
  },

  // Admin attendance routes
  getDailyAttendance: async (params?: any, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/attendance/admin/daily", params, authContext)
  },

  getAttendanceByDateRange: async (params?: any, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/attendance/admin/range", params, authContext)
  },

  getAttendanceSummary: async (params?: any, authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/attendance/admin/summary", params, authContext)
  },

  fetchNotifications: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/notifications", undefined, authContext)
  },

  markAsRead: async (id: string, authContext: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().put(`/api/notifications/${id}/read`,  authContext)
  },

  markAllAsRead: async (authContext?: ReturnType<typeof useAuth>) => {
    return ApiClient.getInstance().get("/api/notifications/read-all", undefined, authContext)
  },
}
