import apiClient from './client';

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}

export interface FamilyMemberInput {
  name: string;
  phone: string;
}

/**
 * Get all family members for the current user
 */
export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const response = await apiClient.get<{ success: boolean; data: FamilyMember[] }>(
    '/api/v1/users/me/family'
  );
  return response.data.data;
};

/**
 * Add a new family member
 */
export const addFamilyMember = async (member: FamilyMemberInput): Promise<FamilyMember> => {
  const response = await apiClient.post<{ success: boolean; data: FamilyMember }>(
    '/api/v1/users/me/family',
    member
  );
  return response.data.data;
};

/**
 * Update a family member
 */
export const updateFamilyMember = async (
  id: string,
  updates: Partial<FamilyMemberInput & { isActive: boolean }>
): Promise<FamilyMember> => {
  const response = await apiClient.put<{ success: boolean; data: FamilyMember }>(
    `/api/v1/users/me/family/${id}`,
    updates
  );
  return response.data.data;
};

/**
 * Delete a family member
 */
export const deleteFamilyMember = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/users/me/family/${id}`);
};

/**
 * Generate a join code for family members to register themselves
 */
export const generateJoinCode = async (): Promise<{
  code: string;
  joinUrl: string;
  expiresIn: number;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { code: string; joinUrl: string; expiresIn: number };
  }>('/api/v1/users/me/family/invite');
  return response.data.data;
};

/**
 * Validate a join code
 */
export const validateJoinCode = async (code: string): Promise<{ valid: boolean; userEmail: string }> => {
  const response = await apiClient.get<{ success: boolean; data: { valid: boolean; userEmail: string } }>(
    `/api/v1/users/family/join/${code}`
  );
  return response.data.data;
};

/**
 * Join as a family member using a code
 */
export const joinWithCode = async (code: string, name: string, phone: string): Promise<void> => {
  await apiClient.post('/api/v1/users/family/join', { code, name, phone });
};
