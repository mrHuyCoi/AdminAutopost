export interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: Date;
  lastLoginAt: Date;
  totalPosts: number;
  connectedAccounts: string[];
  subscription: {
    plan: string;
    features: string[];
  };
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalAccounts: number;
  revenue: number;
  platformStats: any[];
  recentActivity: any[];
}

export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface AdminLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  targetType: string;
  targetId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface AdminFilter {
  search?: string;
  role?: string;
  status?: string;
  platform?: string;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} 