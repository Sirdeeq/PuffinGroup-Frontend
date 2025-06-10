export interface AdminDashboardResponse {
  stats: {
    totalDepartments: number
    totalActiveUsers: number
    totalFiles: number
    recentActivities: Array<{
      id: string
      action: string
      user: {
        fullName: string
      }
      createdAt: string
      type: "success" | "warning" | "info"
    }>
    filesByDepartment: Array<{
      departmentName: string
      count: number
    }>
    requestsByDepartment: Array<{
      departmentName: string
      count: number
    }>
  }
}

export interface DirectorDashboardResponse {
  stats: {
    pendingApprovals: number
    filesReviewed: number
    requestsApproved: number
    urgentItems: number
  }
}

export interface DepartmentDashboardResponse {
  stats: {
    myFiles: number
    sharedFiles: number
    pendingRequests: number
    completed: number
  }
}
