import apiClient from './client';

export type MessageStyle = 'professional' | 'witty' | 'sarcastic' | 'mission';

export interface User {
  _id: string;
  email: string;
  microsoftId: string;
  phone: string;
  timezone: string;
  smsTime: string;
  isActive: boolean;
  messageStyle: MessageStyle;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  // Extended profile information
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

/**
 * Get current user's profile
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<{ success: boolean; data: UserProfile }>('/api/v1/users/me');
  return response.data.data;
};

/**
 * Update user preferences
 */
export interface UpdatePreferencesPayload {
  phone?: string;
  timezone?: string;
  smsTime?: string;
  isActive?: boolean;
  messageStyle?: MessageStyle;
}

export const updateUserPreferences = async (
  preferences: UpdatePreferencesPayload,
): Promise<{ success: boolean; message: string; data: Partial<UserProfile> }> => {
  const response = await apiClient.put('/api/v1/users/preferences', preferences);
  return response.data;
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/api/v1/users/${userId}`);
  return response.data;
};
