import apiClient from './client';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  timezone: string;
  smsTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthStatusResponse {
  user: AuthUser;
}

/**
 * Check if user is currently authenticated
 */
export const checkAuthStatus = async (): Promise<AuthStatusResponse | null> => {
  try {
    const response = await apiClient.get<AuthStatusResponse>('/auth/status');
    return response.data;
  } catch (error) {
    // User is not authenticated
    return null;
  }
};

/**
 * Initiate Microsoft OAuth login
 * This will redirect the user to Microsoft login page
 */
export const loginWithMicrosoft = (): void => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  window.location.href = `${API_URL}/auth/login`;
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  await apiClient.get('/auth/logout');
  window.location.reload();
};
