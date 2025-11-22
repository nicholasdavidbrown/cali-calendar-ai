import apiClient from './client';

export interface User {
  _id: string;
  email: string;
  microsoftId: string;
  phone: string;
  timezone: string;
  smsTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface UsersResponse {
  success: boolean;
  count: number;
  data: User[];
}

export interface StatsResponse {
  success: boolean;
  data: UserStats;
}

/**
 * Fetch all users from the database
 */
export const fetchUsers = async (): Promise<UsersResponse> => {
  const response = await apiClient.get<UsersResponse>('/api/v1/users');
  return response.data;
};

/**
 * Fetch user statistics
 */
export const fetchUserStats = async (): Promise<StatsResponse> => {
  const response = await apiClient.get<StatsResponse>('/api/v1/users/stats');
  return response.data;
};
